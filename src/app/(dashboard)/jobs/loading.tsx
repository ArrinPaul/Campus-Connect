export default function JobsLoading() {
 return (
 <div className="max-w-4xl mx-auto py-8 px-4">
 <div className="h-8 w-48 bg-muted/50 rounded-md animate-pulse mb-6" />
 <div className="space-y-4">
 {[...Array(5)].map((_, i) => (
 <div key={i} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
 ))}
 </div>
 </div>
 )
}
