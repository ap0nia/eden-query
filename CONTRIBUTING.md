# Contributing

Thank you for considering to contribute to this project!

Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

This guide will provide an overview of the entire contribution workflow.
This workflow starts from opening an issue, creating a pull request,
communicating during the review process, and finally merging the pull request into production.

## Setup

### Prerequisites

#### JavaScript Runtime

In order to develop this project, a JavaScript runtime such as Node.js, Deno, or Bun needs to be used.

- [nvm](https://github.com/nvm-sh/nvm) allows you to manage multiple Node.js versions.
- [fnm](https://github.com/Schniz/fnm) allows you to manage multiple Node.js versions.

#### Package Manager

This project primarily uses [`pnpm-workspaces`](https://pnpm.io/workspaces) to manage packages
in this monorepository.

- [pnpm](https://pnpm.io)

1. Clone this repository and start working in the project's root directory.

```sh
git clone https://github.com/ap0nia/eden-query
cd eden-query
```

2. Install dependencies.

```sh
# pnpm
pnpm install
```

3. Try building the packages.

```sh
pnpm build
```

4. Try running tests.

```sh
pnpm test
```

### Unit Testing

All test files are located inside the `test/` directory of their respective projects and
are written for the [vitest](https://vitest.dev) testing framework.

## Development

These are the steps you would take to contribute to the project effectively.

### 1. Ensure an issue exists

After you have thought of an issue, check the issues to see if it has been mentioned in an existing issue.
If not, feel free to open one describing the feature, bug report, or other type of issue.

Now that this issue exists, you can open a new branch that addresses this request.

### 2. Fork the repository

You may need to [fork the repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)
to your personal account before continuing, so that you may have full control over the codebase
while being able to open pull requests to the origin.

### 3. Create a new branch

Create a new branch on your forked repository that addresses the issue.

```sh
git checkout -b my-issue-topic
```

### 4. Implement your request

Happy coding! It's OK to make many small commits as you work; GitHub can automatically squash them before merging.

### 5. Open a pull request

Once you're happy with your solution, you can open a pull request from your fork to this
repository's `main` branch. After that, you can wait to receive feedback from a reviewer.

### 6. Review process

During the review process, a maintainer will communicate any outstanding adjustments to be made
to the code prior to merging the pull request. Once everything has been settled and approved,
the maintainer will merge the pull request into the main branch.

### 7. Celebrate! 🎉

Thanks for your contribution and effort towards improving this project.
Thank you for being part of our ✨ community 💖!
