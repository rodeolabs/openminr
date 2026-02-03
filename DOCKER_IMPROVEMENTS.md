# Docker & Supabase Infrastructure Analysis

## Current State Analysis

### System Resources
- **Docker Version**: 29.2.0
- **Operating System**: Docker Desktop (Linux Kernel 6.12.67)
- **CPUs**: 10 cores
- **Total Memory**: 7.653 GiB
- **Container Count**: 12 (11 Supabase services + Playwright MCP)

### Container Resource Usage
```
Service                          Memory Usage    Status
─────────────────────────────────────────────────────────
supabase_analytics_steinmap    611.7 MB        ✅ Healthy
supabase_realtime_steinmap     278.2 MB        ✅ Healthy
supabase_studio_steinmap       238.6 MB        ✅ Healthy
supabase_db_steinmap           203.9 MB        ✅ Healthy
supabase_storage_steinmap      175.0 MB        ✅ Healthy
supabase_pg_meta_steinmap      129.8 MB        ✅ Healthy
supabase_vector_steinmap       126.8 MB        ✅ Healthy
supabase_kong_steinmap         106.2 MB        ✅ Healthy
supabase_rest_steinmap         72.7 MB         ✅ Healthy
supabase_auth_steinmap         11.0 MB         ✅ Healthy
supabase_inbucket_steinmap     21.8 MB         ✅ Healthy
pensive_elgamal (Playwright)   57.7 MB         ✅ Running
─────────────────────────────────────────────────────────
TOTAL                          ~2.0 GB         
Available                      ~5.6 GB
```

### Current Issues Identified

#### 1. **No Critical Crashes Detected**
- All containers are currently running and healthy
- Playwright MCP container shows 0 restarts
- Most services show "healthy" status

#### 2. **Security Warnings from Supabase**
Several security advisors flagged issues:
- **RLS Policy Always True**: Some INSERT policies use `WITH CHECK (true)`
- **Function Search Path Mutable**: Several functions lack explicit search_path
- **Extension in Public**: PostGIS installed in public schema

#### 3. **Analytics Container Warnings**
- Elixir/Phoenix warnings about MIME library recompilation
- Long message queue warnings (non-critical)

## Recommendations for Stability Improvements

### 1. **Resource Limits & Monitoring**

Add memory limits to prevent runaway containers:

```yaml
# docker-compose.override.yml (create this file)
services:
  supabase-analytics:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
  
  supabase-realtime:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
  
  supabase-db:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### 2. **Restart Policies**

Ensure all services have appropriate restart policies:

```yaml
# Add to all Supabase services in docker-compose
restart: unless-stopped
```

### 3. **Health Check Improvements**

Enhance health checks for critical services:

```yaml
# For PostgreSQL
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s

# For Kong
healthcheck:
  test: ["CMD", "kong", "health"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### 4. **Log Management**

Prevent log files from consuming disk space:

```yaml
# Add logging configuration
logging:
  driver: "json-file"
  options:
    max-size: "100m"
    max-file: "3"
```

### 5. **Network Isolation**

Consider creating a dedicated network for Supabase:

```bash
# Already exists, but verify isolation
docker network create --driver bridge supabase_isolated
```

### 6. **Database Connection Pooling**

Enable the connection pooler for better performance:

```toml
# supabase/config.toml
[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100
```

### 7. **Security Hardening**

Address the security warnings:

```sql
-- Fix function search paths
ALTER FUNCTION public.find_similar_entities SET search_path = public;
ALTER FUNCTION public.get_entity_network SET search_path = public;
ALTER FUNCTION public.semantic_search SET search_path = public;
-- ... etc for other functions

-- Move postgis to separate schema (optional)
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION postgis SET SCHEMA extensions;
```

### 8. **Backup Strategy**

Implement automated backups:

```bash
# Add to crontab for daily backups
0 2 * * * docker exec supabase_db_steinmap pg_dump -U postgres -Fc postgres > /backup/supabase_$(date +\%Y\%m\%d).dump
```

### 9. **Monitoring Setup**

Add Prometheus/Grafana for monitoring:

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

### 10. **Performance Tuning**

Optimize PostgreSQL for local development:

```sql
-- Add to supabase/config.toml or run manually
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '1536MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET work_mem = '8MB';
ALTER SYSTEM SET max_connections = 100;
```

## Immediate Actions to Take

1. **Create docker-compose.override.yml** with resource limits
2. **Enable connection pooling** in config.toml
3. **Set up log rotation** to prevent disk full issues
4. **Configure automated backups**
5. **Monitor memory usage** over time with `docker stats`

## If Crashes Continue

If you experience crashes after these improvements:

1. **Check Docker Desktop resources**:
   - Open Docker Desktop → Settings → Resources
   - Ensure memory limit is at least 8GB
   - Check CPU allocation (recommend 6+ cores)

2. **Enable Docker debug logging**:
   ```bash
   docker system events --since 1h
   ```

3. **Monitor container exits**:
   ```bash
   docker events --filter event=die --filter event=restart
   ```

4. **Check system logs**:
   ```bash
   docker logs --tail 500 <container_name>
   ```

## Current Status: ✅ STABLE

Your Docker infrastructure is currently stable with all services running. The memory usage (2GB/7.6GB) is well within safe limits. No critical issues detected.
