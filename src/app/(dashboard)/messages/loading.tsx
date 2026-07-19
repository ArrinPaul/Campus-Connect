export default function MessagesLoading() {
 return (
 <div className="flex h-[calc(100vh-4rem)]">
 <div className="w-80 border-r border-hairline p-4 space-y-3">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-16 bg-canvas rounded-lg animate-pulse" />
 ))}
 </div>
 <div className="flex-1 flex items-center justify-center">
 <div className="h-8 w-48 bg-canvas rounded-md animate-pulse" />
 </div>
 </div>
 )
}
