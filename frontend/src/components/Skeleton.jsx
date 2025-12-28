import { motion } from "framer-motion";

export function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="h-48 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AvatarSkeleton({ size = 48 }) {
  return (
    <div className="rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" style={{ width: size, height: size }} />
  );
}

export function UserSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer"
    >
      <AvatarSkeleton size={48} />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </motion.div>
  );
}

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default PostCardSkeleton;
