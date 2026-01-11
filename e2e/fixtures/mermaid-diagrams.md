# Mermaid Diagrams Test

Testing various Mermaid diagram types.

[[toc]]

## Flowchart

```mermaid
flowchart TB
    subgraph Input
        A[Raw Data] --> B[Validation]
    end

    subgraph Processing
        B --> C{Valid?}
        C -->|Yes| D[Transform]
        C -->|No| E[Error Handler]
        D --> F[Normalize]
        E --> G[Log Error]
        G --> H[Return Error]
    end

    subgraph Output
        F --> I[Store]
        I --> J[Response]
        H --> J
    end
```

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant C as Client
    participant A as API Server
    participant D as Database
    participant R as Redis Cache

    U->>C: Click Login
    C->>A: POST /auth/login
    A->>D: Query user
    D-->>A: User data
    A->>A: Validate password
    A->>R: Store session
    R-->>A: OK
    A-->>C: JWT Token
    C-->>U: Dashboard

    Note over U,R: Authentication Flow
```

## Class Diagram

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        -String passwordHash
        +login()
        +logout()
        +updateProfile()
    }

    class Post {
        +String id
        +String title
        +String content
        +Date createdAt
        +publish()
        +archive()
    }

    class Comment {
        +String id
        +String text
        +Date createdAt
        +edit()
        +delete()
    }

    User "1" --> "*" Post : creates
    User "1" --> "*" Comment : writes
    Post "1" --> "*" Comment : has
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review : submit
    Review --> Draft : reject
    Review --> Approved : approve
    Approved --> Published : publish
    Published --> Archived : archive
    Archived --> [*]

    state Review {
        [*] --> Pending
        Pending --> InReview : assign
        InReview --> Pending : reassign
    }
```

## Entity Relationship

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        int id PK
        string name
        string email
    }
    ORDER ||--|{ LINE_ITEM : contains
    ORDER {
        int id PK
        date created_at
        string status
    }
    PRODUCT ||--o{ LINE_ITEM : "ordered in"
    PRODUCT {
        int id PK
        string name
        decimal price
    }
    LINE_ITEM {
        int quantity
        decimal subtotal
    }
```

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD

    section Planning
    Requirements    :a1, 2024-01-01, 7d
    Design          :a2, after a1, 14d

    section Development
    Backend API     :b1, after a2, 21d
    Frontend UI     :b2, after a2, 21d
    Integration     :b3, after b1, 7d

    section Testing
    Unit Tests      :c1, after b1, 7d
    E2E Tests       :c2, after b3, 7d

    section Deployment
    Staging         :d1, after c2, 3d
    Production      :d2, after d1, 1d
```

## Pie Chart

```mermaid
pie showData
    title Browser Market Share
    "Chrome" : 65
    "Safari" : 19
    "Firefox" : 8
    "Edge" : 5
    "Others" : 3
```

## Git Graph

```mermaid
gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Feature A"
    commit id: "Feature B"
    checkout main
    merge develop id: "v1.0"
    branch hotfix
    commit id: "Fix bug"
    checkout main
    merge hotfix id: "v1.0.1"
    checkout develop
    commit id: "Feature C"
    checkout main
    merge develop id: "v1.1"
```

## Journey Map

```mermaid
journey
    title User Onboarding Experience
    section Discovery
      Find website: 3: User
      Read landing page: 4: User
    section Signup
      Click signup: 5: User
      Fill form: 3: User
      Verify email: 4: User, System
    section First Use
      Complete tutorial: 4: User
      Create first item: 5: User
      Share with team: 3: User
```

## Mindmap

```mermaid
mindmap
  root((Web Development))
    Frontend
      HTML
      CSS
        Tailwind
        SASS
      JavaScript
        React
        Vue
        Angular
    Backend
      Node.js
      Python
      Go
    Database
      SQL
        PostgreSQL
        MySQL
      NoSQL
        MongoDB
        Redis
    DevOps
      Docker
      Kubernetes
      CI/CD
```
