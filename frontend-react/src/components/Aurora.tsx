/**
 * 毛玻璃光斑背景：绝对定位于页面内，配合 overflow-hidden 使用
 */
export default function Aurora() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute -top-28 -left-28 w-[460px] h-[460px] rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="absolute top-1/4 -right-36 w-[500px] h-[500px] rounded-full bg-violet-200/40 blur-3xl" />
      <div className="absolute -bottom-36 left-1/4 w-[440px] h-[440px] rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 w-[320px] h-[320px] rounded-full bg-fuchsia-100/40 blur-3xl" />
    </div>
  )
}