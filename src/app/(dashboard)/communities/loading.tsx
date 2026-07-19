export default function CommunitiesLoading() {
 return (
 <div className="max-w-4xl mx-auto py-8 px-4">
 <div className="h-8 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {[...Array(4)].map((_, i) => (
 <div key={i} className="h-40 bg-muted/50 rounded-lg animate-pulse" />
 ))}
 </div>
 </div>
 )
}
