interface IllustrationProps {
  className?: string
}

// 本地内联 SVG 插画，保证必渲染，不依赖外部资源/构建管线
export function LibraryIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      role="img"
      aria-label="校园知识库"
    >
      <defs>
        <linearGradient id="lib-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c86d6" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="24" fill="url(#lib-bg)" />
      {/* 书架 */}
      <rect x="30" y="26" width="100" height="10" rx="5" fill="#ffffff" opacity="0.9" />
      <rect x="30" y="70" width="100" height="10" rx="5" fill="#ffffff" opacity="0.9" />
      <rect x="30" y="114" width="100" height="10" rx="5" fill="#ffffff" opacity="0.9" />
      {/* 第一排书籍 */}
      <rect x="34" y="38" width="12" height="30" rx="2" fill="#c7d2fe" />
      <rect x="50" y="44" width="10" height="24" rx="2" fill="#fbcfe8" />
      <rect x="64" y="36" width="14" height="32" rx="2" fill="#a5f3fc" />
      <rect x="82" y="42" width="12" height="26" rx="2" fill="#fde68a" />
      <rect x="98" y="38" width="11" height="30" rx="2" fill="#bbf7d0" />
      <rect x="113" y="46" width="13" height="22" rx="2" fill="#fcd34d" />
      {/* 第二排书籍 */}
      <rect x="34" y="82" width="13" height="30" rx="2" fill="#fde68a" />
      <rect x="51" y="86" width="11" height="26" rx="2" fill="#a5f3fc" />
      <rect x="66" y="80" width="12" height="32" rx="2" fill="#fbcfe8" />
      <rect x="82" y="84" width="14" height="28" rx="2" fill="#bbf7d0" />
      <rect x="100" y="80" width="10" height="32" rx="2" fill="#c7d2fe" />
      <rect x="114" y="88" width="12" height="24" rx="2" fill="#fcd34d" />
      {/* 第三排书籍 */}
      <rect x="36" y="124" width="12" height="12" rx="2" fill="#bbf7d0" />
      <rect x="52" y="124" width="14" height="12" rx="2" fill="#fbcfe8" />
      <rect x="70" y="124" width="11" height="12" rx="2" fill="#a5f3fc" />
    </svg>
  )
}

export function AssistantIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      role="img"
      aria-label="校园知识助手"
    >
      <defs>
        <linearGradient id="ast-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="24" fill="url(#ast-bg)" />
      {/* 机器人身体 */}
      <rect x="55" y="70" width="50" height="44" rx="12" fill="#ffffff" />
      {/* 天线 */}
      <line x1="80" y1="70" x2="80" y2="56" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="80" cy="52" r="6" fill="#ffffff" />
      {/* 头部显示屏 */}
      <rect x="62" y="76" width="36" height="26" rx="7" fill="#7c86d6" />
      {/* 眼睛 */}
      <circle cx="71" cy="88" r="4" fill="#ffffff" />
      <circle cx="89" cy="88" r="4" fill="#ffffff" />
      {/* 嘴巴 */}
      <path d="M73 97 Q80 102 87 97" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* 手臂 */}
      <rect x="42" y="78" width="10" height="22" rx="5" fill="#ffffff" />
      <rect x="108" y="78" width="10" height="22" rx="5" fill="#ffffff" />
      {/* 腿部 */}
      <rect x="62" y="116" width="12" height="16" rx="5" fill="#ffffff" />
      <rect x="86" y="116" width="12" height="16" rx="5" fill="#ffffff" />
    </svg>
  )
}