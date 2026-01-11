# Code Highlighting Test

Testing syntax highlighting for various languages.

[[toc]]

## TypeScript

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

type UserRole = "admin" | "editor" | "viewer";

class UserService {
  private users: Map<string, User> = new Map();

  async createUser(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findAll(): User[] {
    return Array.from(this.users.values());
  }
}

// Generic function
function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

## Python

```python
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
import asyncio

@dataclass
class Article:
    id: int
    title: str
    content: str
    author: str
    published_at: Optional[datetime] = None
    tags: List[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []

class ArticleRepository:
    def __init__(self):
        self._articles: dict[int, Article] = {}
        self._next_id = 1

    async def create(self, title: str, content: str, author: str) -> Article:
        article = Article(
            id=self._next_id,
            title=title,
            content=content,
            author=author
        )
        self._articles[article.id] = article
        self._next_id += 1
        return article

    async def find_by_tag(self, tag: str) -> List[Article]:
        return [a for a in self._articles.values() if tag in a.tags]

# Async context manager
class DatabaseConnection:
    async def __aenter__(self):
        print("Connecting to database...")
        await asyncio.sleep(0.1)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("Closing connection...")
        await asyncio.sleep(0.1)

# Decorator
def retry(max_attempts: int = 3, delay: float = 1.0):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    await asyncio.sleep(delay)
        return wrapper
    return decorator
```

## Rust

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub max_connections: usize,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            host: String::from("localhost"),
            port: 8080,
            max_connections: 100,
        }
    }
}

pub struct Cache<K, V> {
    data: Arc<Mutex<HashMap<K, V>>>,
    max_size: usize,
}

impl<K: Eq + std::hash::Hash + Clone, V: Clone> Cache<K, V> {
    pub fn new(max_size: usize) -> Self {
        Self {
            data: Arc::new(Mutex::new(HashMap::new())),
            max_size,
        }
    }

    pub fn get(&self, key: &K) -> Option<V> {
        let data = self.data.lock().unwrap();
        data.get(key).cloned()
    }

    pub fn set(&self, key: K, value: V) -> Result<(), &'static str> {
        let mut data = self.data.lock().unwrap();
        if data.len() >= self.max_size && !data.contains_key(&key) {
            return Err("Cache is full");
        }
        data.insert(key, value);
        Ok(())
    }
}

// Async trait example
#[async_trait::async_trait]
pub trait DataStore {
    async fn fetch(&self, id: &str) -> Result<Vec<u8>, Box<dyn std::error::Error>>;
    async fn store(&self, id: &str, data: &[u8]) -> Result<(), Box<dyn std::error::Error>>;
}
```

## Go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type UserStore struct {
	mu    sync.RWMutex
	users map[string]*User
}

func NewUserStore() *UserStore {
	return &UserStore{
		users: make(map[string]*User),
	}
}

func (s *UserStore) Get(id string) (*User, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	user, ok := s.users[id]
	return user, ok
}

func (s *UserStore) Set(user *User) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.users[user.ID] = user
}

// HTTP handler with context
func (s *UserStore) HandleGetUser(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	select {
	case <-ctx.Done():
		http.Error(w, "Request timeout", http.StatusRequestTimeout)
		return
	default:
		id := r.URL.Query().Get("id")
		user, ok := s.Get(id)
		if !ok {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		json.NewEncoder(w).Encode(user)
	}
}

// Generics (Go 1.18+)
func Map[T, U any](items []T, fn func(T) U) []U {
	result := make([]U, len(items))
	for i, item := range items {
		result[i] = fn(item)
	}
	return result
}
```

## SQL

```sql
-- Create tables with constraints
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status) WHERE status = 'published';

-- Complex query with CTE and window functions
WITH monthly_stats AS (
    SELECT
        user_id,
        DATE_TRUNC('month', created_at) AS month,
        COUNT(*) AS post_count,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count
    FROM posts
    WHERE created_at >= NOW() - INTERVAL '1 year'
    GROUP BY user_id, DATE_TRUNC('month', created_at)
)
SELECT
    u.name,
    ms.month,
    ms.post_count,
    ms.published_count,
    ROUND(ms.published_count::DECIMAL / NULLIF(ms.post_count, 0) * 100, 2) AS publish_rate,
    ROW_NUMBER() OVER (PARTITION BY ms.user_id ORDER BY ms.month DESC) AS month_rank,
    SUM(ms.post_count) OVER (PARTITION BY ms.user_id ORDER BY ms.month) AS cumulative_posts
FROM monthly_stats ms
JOIN users u ON u.id = ms.user_id
ORDER BY u.name, ms.month DESC;
```

## Shell/Bash

```bash
#!/bin/bash
set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="${SCRIPT_DIR}/deploy.log"
readonly ENV="${1:-production}"

log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a "$LOG_FILE"
}

check_dependencies() {
    local deps=("docker" "kubectl" "helm")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log "ERROR" "Missing dependency: $dep"
            exit 1
        fi
    done
    log "INFO" "All dependencies found"
}

deploy() {
    local app_name="$1"
    local version="$2"

    log "INFO" "Deploying $app_name:$version to $ENV"

    # Build and push image
    docker build -t "registry.example.com/${app_name}:${version}" .
    docker push "registry.example.com/${app_name}:${version}"

    # Deploy with Helm
    helm upgrade --install "$app_name" ./charts/"$app_name" \
        --namespace "$ENV" \
        --set image.tag="$version" \
        --set environment="$ENV" \
        --wait --timeout 5m

    log "INFO" "Deployment complete"
}

# Main
main() {
    check_dependencies

    # Parse arguments
    while getopts "a:v:h" opt; do
        case $opt in
            a) APP_NAME="$OPTARG" ;;
            v) VERSION="$OPTARG" ;;
            h) echo "Usage: $0 [-a app_name] [-v version] [environment]"; exit 0 ;;
            *) exit 1 ;;
        esac
    done

    deploy "${APP_NAME:-myapp}" "${VERSION:-latest}"
}

main "$@"
```

## YAML

```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
    version: v1.2.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      containers:
        - name: api
          image: registry.example.com/api:v1.2.0
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 9090
              name: metrics
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: api-secrets
                  key: database-url
            - name: LOG_LEVEL
              value: "info"
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: api-server
                topologyKey: kubernetes.io/hostname
```

## JSON

```json
{
  "name": "my-application",
  "version": "1.0.0",
  "config": {
    "server": {
      "host": "0.0.0.0",
      "port": 8080,
      "cors": {
        "origins": ["https://example.com", "https://app.example.com"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "credentials": true
      }
    },
    "database": {
      "type": "postgresql",
      "connection": {
        "host": "localhost",
        "port": 5432,
        "database": "myapp",
        "pool": {
          "min": 5,
          "max": 20,
          "idleTimeout": 30000
        }
      }
    },
    "cache": {
      "type": "redis",
      "ttl": 3600,
      "prefix": "app:"
    },
    "features": {
      "rateLimiting": true,
      "metrics": true,
      "tracing": false
    }
  }
}
```
