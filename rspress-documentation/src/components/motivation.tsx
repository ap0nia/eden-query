export type MotivationProps = {
  children?: React.ReactNode
}

export function Motivation(props: MotivationProps) {
  return (
    <article className="space-y-8">
      <div className="grid grid-cols-2 items-center gap-8">
        <header className="flex flex-1 flex-col gap-6 text-xl">
          <div className="mb-2 flex flex-col gap-3">
            <h3 className="text-700 text-2xl font-medium">Our Philosophy</h3>

            <h2 className="bg-gradient-to-r from-sky-500 to-violet-500 bg-clip-text text-6xl font-semibold leading-[4.25rem] text-transparent">
              Design for Humans
            </h2>
          </div>

          <p className="max-w-md leading-normal">
            Our goal is to design an ergonomic, sensible, and productive framework that even
            beginners can use easily
          </p>

          <p className="max-w-md leading-normal">
            Designed to avoid unnecessary complexity and type complexity for you to focus on
            building
          </p>

          <p className="leading-normal">
            <span>A framework that feels&nbsp;</span>
            <span className="bg-gradient-to-r from-violet-500 to-sky-500 bg-clip-text font-semibold text-transparent">
              just like JavaScript
            </span>
          </p>
        </header>

        <section className="showcase">{props.children}</section>
      </div>

      <footer className="grid grid-cols-2 gap-4">
        <article className="space-y-2">
          <h4>
            <span className="icon-[mdi--package-variant-closed] h-6 w-6 align-middle"></span>
            <span>&nbsp;&nbsp;</span>
            <span>Just return</span>
          </h4>

          <div className="text-sm">
            <p>A string, number, or complex JSON</p>
            <p>All we need to do is return</p>
          </div>
        </article>

        <article className="space-y-2">
          <h4>
            <span className="icon-[mdi--image-area] h-6 w-6 align-middle"></span>
            <span>&nbsp;&nbsp;</span>
            <span>File support built-in</span>
          </h4>

          <div className="text-sm">
            <p>To send a file or image, just return</p>
            <p>Nothing more or less</p>
          </div>
        </article>

        <article className="space-y-2">
          <h4>
            <span className="icon-[lineicons--cloud-rain] h-6 w-6 align-middle"></span>
            <span>&nbsp;&nbsp;</span>
            <span>Stream response</span>
          </h4>

          <div className="text-sm">
            <p>
              <span>Use</span>
              <span className="font-mono font-bold text-violet-500">&nbsp;yield&nbsp;</span>
              <span>to stream a response</span>
            </p>

            <p>All we need to do is return</p>
          </div>
        </article>

        <article className="space-y-2">
          <h4>
            <span className="icon-[mingcute--heartbeat-line] h-6 w-6 align-middle"></span>
            <span>&nbsp;&nbsp;</span>
            <span>Data in real-time</span>
          </h4>

          <div className="text-sm">
            <p>With µWebSocket built-in</p>
            <p>Send live data in just 3 lines</p>
          </div>
        </article>
      </footer>
    </article>
  )
}
