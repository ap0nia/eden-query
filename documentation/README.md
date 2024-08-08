# Elysia documentation

Written by VitePress

## Links

```mermaid
---
title: Eden Client to Server
---
stateDiagram-v2
    direction LR

    Client --> Server : Request
    Server --> Client : Response

    state Client {
        direction LR
        state "Operation" as Op
        state "Link" as link_1
        state "Link" as link_2
        state "Terminating Link" as t_link

        Op --> link_1 : Initiated
        link_1 --> Op : Completed

        link_1 --> link_2 : down
        link_2 --> link_1 : up

        link_2 --> t_link : down
        t_link --> link_2 : up
    }

    state "Eden Server" as Server
```

```mermaid
---
title: Eden Client to Server
---

stateDiagram
    direction LR

    classDef yes stroke: green
    classDef no stroke: red

    state "Eden Client" as Client {
        state "Operation" as Operation
        state "Link" as link_1
        state "Link" as link_2
        state "Link" as link_3
        state "Link" as link_4
        state "Terminating Link" as terminating_link_1
        state "Terminating Link" as terminating_link_2
        state "Split Link" as split_link
        state "true branch" as True
        state "false branch" as False
        state split_branch <<choice>>

        Operation --> link_1 : Initiated
        link_1 --> Operation : Completed

        link_1 --> link_2 : down
        link_2 --> link_1 : up

        link_2 --> split_link  : down
        split_link --> link_2 : up

        split_link --> split_branch

        split_branch --> link_3 : Yes
        split_branch --> link_4 : No

        state True  {
            link_3 --> terminating_link_1 : down
            terminating_link_1 --> link_3 : up
            terminating_link_1 --> handle
        }

        state False {
            link_4 --> terminating_link_2 : down
            terminating_link_2 --> link_4 : up
            terminating_link_2 --> handle
        }

        state handle <<join>>
    }

    handle --> Server : Request
    Server --> handle : Response

    class True yes
    class False no
```
