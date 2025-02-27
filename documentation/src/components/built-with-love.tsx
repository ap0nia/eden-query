export function BuiltWithLove() {
  return (
    <footer className="mb-6 mt-8 flex flex-col items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-400">
      <p>
        <span>Built with 💖 for</span>

        <label
          htmlFor="elysia"
          className="appearance-none rounded px-1 py-0.5 text-sm text-pink-500 transition-colors hover:bg-pink-500/10 focus:bg-pink-500/15"
        >
          Elysia
        </label>
      </p>

      <input id="elysia" className="built-with-love hidden" type="checkbox" />

      <div className="elysia fill-mode-both fade-out fade-in slide-in-from-bottom-4 slide-out-to-bottom-4 duration-500 ease-in-out">
        <figure className="w-36">
          <a target="_blank" href="https://youtu.be/k-K28-A4fBc">
            <video muted autoPlay loop className="rounded-3xl">
              <source src="/assets/elysia.mp4" />
            </video>
          </a>
        </figure>
      </div>
    </footer>
  )
}
