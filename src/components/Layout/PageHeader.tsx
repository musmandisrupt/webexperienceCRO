interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="px-8 pt-8 pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[#64748B]">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  )
}
