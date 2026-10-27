import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const out = (value: unknown) => ({content:[{type:"text" as const,text:JSON.stringify(value)}]});
const error = (message:string) => ({isError:true,content:[{type:"text" as const,text:message}]});
const handler = createMcpHandler(server => {
 server.registerTool("workspace_status",{description:"Inspect current capabilities; scheduling and publishing are disabled.", inputSchema:z.object({})},async()=>out({phase:"drafts_only",canSchedule:false,canPublish:false,requiresApproval:true,databaseConfigured:Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}));
 server.registerTool("list_content_drafts",{description:"Read proposed posts, without publishing.",inputSchema:z.object({artist:z.enum(["patrick_rick","chris_rick","patrick_meets_rico"]).optional(),limit:z.number().int().min(1).max(25).default(10)})},async({artist,limit})=>{
  try {
   let q=getSupabaseAdmin().from("content_drafts").select("id,artist,platform,title,era,caption,planned_at,status,created_at").order("created_at",{ascending:false}).limit(limit);
   if(artist)q=q.eq("artist",artist);
   const {data,error:e}=await q;
   return e?error("Unable to list drafts; verify database migration."):out({drafts:data??[]});
  }catch{return error("Database connection unavailable.");}
 });
 server.registerTool("create_content_draft",{description:"Store a DRAFT only when asked; never approves, schedules or publishes.",inputSchema:z.object({
   artist:z.enum(["patrick_rick","chris_rick","patrick_meets_rico"]),
   platform:z.enum(["instagram","tiktok","youtube"]),
   title:z.string().trim().min(1).max(160),
   era:z.string().max(100).optional(),
   caption:z.string().trim().min(1).max(4000),
   planned_at:z.string().datetime({offset:true}).optional()
 })},async(input)=>{
  try{
   const {data,error:e}=await getSupabaseAdmin().from("content_drafts").insert({...input,status:"DRAFT"}).select("id,artist,platform,title,era,caption,planned_at,status,created_at").single();
   return e?error("Unable to save draft; verify migration."):out({saved:true,draft:data,published:false,scheduled:false});
  }catch{return error("Database connection unavailable.");}
 });
});
function authorized(req:Request):boolean{
 const token=process.env.AGENT_MCP_TOKEN;
 if(!token||token.length<32)return false;
 const h=req.headers.get("authorization")??"";
 if(!h.startsWith("Bearer "))return false;
 const a=Buffer.from(h.slice(7));const b=Buffer.from(token);
 return a.length===b.length&&timingSafeEqual(a,b);
}
async function secured(req:Request){
 if(!process.env.AGENT_MCP_TOKEN||process.env.AGENT_MCP_TOKEN.length<32)return Response.json({error:"Not configured"},{status:503});
 if(!authorized(req))return Response.json({error:"Unauthorized"},{status:401,headers:{"WWW-Authenticate":'Bearer realm="Patrick Rick MCP"'}});
 return handler(req);
}
export {secured as GET,secured as POST,secured as DELETE};
