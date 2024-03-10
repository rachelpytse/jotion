import {defineSchema, defineTable} from "convex/server"
import {v} from "convex/values"

export default defineSchema({
    documents: defineTable({
        title: v.string(),
        userId: v.string(),
        //for soft deleting of document
        isAchived: v.boolean(),
        parentDocument: v.optional(v.id("documents")),
        content: v.optional(v.string()),
        coverImage: v.optional(v.string()),
        icon: v.optional(v.string()),
        isPublished: v.boolean(),
    })
    .index("by_user", ["userId"])
    //use in sidebar
    .index("by_user_parent", ["userId", "parentDocument"])
})