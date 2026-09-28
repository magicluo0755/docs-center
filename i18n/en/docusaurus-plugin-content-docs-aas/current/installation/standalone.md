---
sidebar_position: 3
title: Standalone Installation
---
# Standalone Installation

## Standard Installation Steps

```bash
# 1. Create a runtime user (do not run as root)
useradd -r -s /sbin/nologin apusic

# 2. Extract the package
tar -zxvf apusic-aas-2.0.0.tar.gz -C /opt/apusic/
chown -R apusic:apusic /opt/apusic/aas

# 3. Grant permissions and import the license
su - apusic
cd /opt/apusic/aas/bin
./license.sh import /path/to/license.lic

# 4. Initialize and start
./init.sh --silent --config=conf/install.yaml
./aas start
```

## Verification and Uninstall

- Verify: run `./aas status` and `curl http://localhost:6888/health`
- Uninstall: run `./aas stop` first, then remove the installation directory (archive data directories per compliance requirements)
