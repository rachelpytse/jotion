import {v} from "convex/values"

import {mutation, query} from "./_generated/server"
import {Doc, Id} from "./_generated/dataModel"

export const archive = mutation({
    //pase the argument document id that we want to archive
    args: {id: v.id("documents")},
    handler: async (ctx, args) => {
        //check identity id
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) {
            throw new Error("Not authenticated")
        }

        const userId = identity.subject

        //fetch the parent document
        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument) {
            throw new Error("Not found")
        }

        if(existingDocument.userId !== userId) {
            throw new Error("Unauthorized")
        }

        const recursiveArchive = async(documentId: Id<"documents">) => {
            const children = await ctx.db
                .query("documents")
                .withIndex("by_user_parent", (q) => (
                    q
                        .eq("userId", userId)
                        .eq("parentDocument", documentId)
                ))
                .collect()

                //use for because cannnot do async promise in map or forEach
                for (const child of children) {
                    await ctx.db.patch(child._id, {
                        isAchived: true,
                    })
                    //check every child one more time that they don't have any children as well
                    // so need to repeat the recursiveArchive function inside of itself to go to the end of the nested child
                    await recursiveArchive(child._id)
                }
        }
        // archive the document, then we modify the data instead of the object
        const document = await ctx.db.patch(args.id, {
            isAchived: true,
        })

        //after modify the main document, we pass the argument id inside of the recursiveArchive function which attempts to fetch all the children which have that id as their parentDocument
        //and then we run a for loop over all those children and we change them to be archived as well
        recursiveArchive(args.id)

        return document
    }
})

export const getSidebar = query({
    args: {
        parentDocument: v.optional(v.id("documents"))
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) {
            throw new Error("Not authenticated")
        }

        const userId = identity.subject

        const documents = await ctx.db
            .query("documents")
            // q is query, eq is equals
            .withIndex("by_user_parent", (q) => 
                q
                .eq("userId", userId)
                // if not passed it's just undefined
                .eq("parentDocument", args.parentDocument)
            )
            .filter((q) =>
                // don't show archived document
                q.eq(q.field("isAchived"), false)
            )
            .order("desc")
            .collect()

            return documents
    }
})

export const create = mutation({
    args: {
        // when we create a document we need to pass the title
        title: v.string(),
        parentDocument: v.optional(v.id("documents"))
    },
    handler: async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) {
            throw new Error("Not authenticated")
        }

        const userId = identity.subject

        const document = await ctx.db.insert("documents", {
            title: args.title,
            parentDocument: args.parentDocument,
            userId,
            isAchived: false,
            isPublished: false
        })

        return document
    }
})

export const getTrash = query({
    handler: async(ctx) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) {
            throw new Error("Not authenticated")
        }

        const userId = identity.subject

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => 
                q.eq(q.field("isAchived"), true)
            )
            .order("desc")
            .collect()

            return documents
    }
})

export const restore = mutation({
    args: {id: v.id("documents")},
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) {
            throw new Error("Not authenticated")
        }

        const userId = identity.subject

        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument) {
            throw new Error("Not found")
        }

        if(existingDocument.userId !== userId) {
            throw new Error("Unauthorized")
        }

        const recursiveRestore = async(documentId: Id<"documents">) => {
            const children = await ctx.db
                .query("documents")
                .withIndex("by_user_parent", (q) => (
                    q
                        .eq("userId", userId)
                        .eq("parentDocument", documentId)
                ))
                .collect()

            for(const child of children) {
                await ctx.db.patch(child._id, {
                    //unarchive
                    isAchived: false,
                })

                await recursiveRestore(child._id)
            }
        }

        const options: Partial<Doc<"documents">> = {
            isAchived: false
        }

        if(existingDocument.parentDocument) {
            const parent = await ctx.db.get(existingDocument?.parentDocument!)
            if(parent?.isAchived) {
                options.parentDocument = undefined
            }
        }

        const document = await ctx.db.patch(args.id, options)

        recursiveRestore(args.id)

        return document
    }
})

export const remove = mutation({
    args: {id: v.id("documents")},
    handler: async(ctx, args) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) {
            throw new Error ("Not authenticated")
        }

        const userId = identity.subject

        const existingDocument = await ctx.db.get(args.id)

        if(!existingDocument) {
            throw new Error("Not found")
        }
        if(existingDocument.userId !== userId) {
            throw new Error("Unauthorized")
        }

        const document = await ctx.db.delete(args.id)

        return document
    }
})

export const getSearch = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity()

        if(!identity) {
            throw new Error("Not authenticated")
        }

        const userId = identity.subject

        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.eq(q.field("isAchived"), false)
                )
            .order("desc")
            .collect()

        return documents
    }
})