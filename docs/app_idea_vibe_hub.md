# One-Sentence Summary

A central hub for all personal vibe coding projects on desktop.

# Core Problem

Projects are separated into different repos, folders, and systems. It is chaotic to keep track off. Furthermore, IDE's and the terminal are not made for DESIGNING apps, but for coding them. With AI coding, it would be better to have a hub that is focused on design, iteration, and giving feedback to the AI, rather than on the coding itself.

# Core Features

- An overview of all personal vibe-coding projects that are on your local disk. The projects could be gathered under a single folder on your harddrive.
- A "project view" that you can open for each project. This view contains all basic information about it, such as its design and status (if it is deployed, and where).
- An editor for writing, prioritizing, and listing feedback and requested improvements about each project/app. Each feedback item should be added to a list that you overview. There should be an easy way to rank the feedback items in order of importance.
- A system for sending feedback about the app directly from the app when it is being used
  - Some sort of backend/database to which you can submit feedback
  - Automatic pulling of the feedback items to local when the app start.
  - When feedback is pulled to the local, there is a view that helps the user to sort it into the priority list for the specific app.
  - When feedback items are ticked of locally, it syncs to the db so that they are checked off there too
  - An API call that can be used to upload feedback about your own app. Should be stack-agnostic so that you can use it to upload no matter in which codebase or on which platform the feedback comes from.
  - Uploading feedback should be protected in some way, so that it can only be done through the apps that have been authorized by the owner.
- A button for opening up claude for each project to start working through the issues.
- An easy way to directly instruct claude to work through issues, with pre-written commands.
  - When claude is instructed to work on issues in a project, there should always be a step where it "interprets" the feedback and checks with the user to make sure they have understood it.

# Additional requirements

- Should run on windows for now, but with the possibility of also building for linux in the future
- As much local-first as possible data about the projects and the user should be on the local hard-drive. DB or cloud should only be used when necessary, for example to be able to send app feedback directly from an app to the user