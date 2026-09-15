# Pull request workflow

Before calling `make_pr`, run `npm run prepare:pr` after committing the intended
changes. If that command creates a merge commit, include it in the pull request.
Do not create the pull request if the command or its validation checks fail.

