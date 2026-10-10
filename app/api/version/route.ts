export const dynamic="force-dynamic";
export async function GET(){
 const commit=process.env.TRENDLAB_COMMIT_SHA||process.env.RAILWAY_GIT_COMMIT_SHA||process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||null;
 return new Response(JSON.stringify({application:"SmartPickShop Trend Lab",commit}),{headers:{"Cache-Control":"private, no-store","Content-Type":"application/json"}});
}
