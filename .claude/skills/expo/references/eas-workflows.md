# EAS Workflows and CI/CD

## EAS Build Profiles

### Complete eas.json Example

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "base": {
      "node": "18.18.0",
      "env": {
        "APP_ENV": "development"
      }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "development-device": {
      "extends": "development",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "extends": "base",
      "distribution": "internal",
      "channel": "preview",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "extends": "base",
      "env": {
        "APP_ENV": "production"
      },
      "channel": "production",
      "autoIncrement": true,
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234"
      },
      "android": {
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

## Build Commands

```bash
# Development builds
eas build --profile development --platform ios
eas build --profile development --platform android
eas build --profile development-device --platform ios  # For physical device

# Preview builds (internal testing)
eas build --profile preview --platform all

# Production builds
eas build --profile production --platform ios
eas build --profile production --platform android

# Build and auto-submit
eas build --profile production --platform ios --auto-submit
```

## EAS Submit

### iOS Submission

```bash
# Submit latest build
eas submit --platform ios

# Submit specific build
eas submit --platform ios --id BUILD_ID

# Submit local build
eas submit --platform ios --path ./app.ipa
```

Required credentials:
- Apple ID
- App Store Connect API Key (recommended) or App-specific password
- ASC App ID

### Android Submission

```bash
# Submit to internal track
eas submit --platform android

# Submit to production
eas submit --platform android --profile production
```

Required:
- Google Play Service Account JSON key
- App must exist in Google Play Console

### Service Account Setup

1. Go to Google Cloud Console
2. Create Service Account with "Service Account User" role
3. Create JSON key
4. In Play Console: Setup > API access > Link service account
5. Grant "Release to production" permission

```json
// eas.json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-services.json",
        "track": "production"
      }
    }
  }
}
```

## EAS Update (OTA)

### Setup

```bash
npx expo install expo-updates
eas update:configure
```

### Configuration

```json
// app.json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/PROJECT_ID"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

### Publishing Updates

```bash
# Update specific channel
eas update --channel production --message "Bug fixes"

# Update with branch name
eas update --branch main

# Preview before publishing
eas update --branch preview --message "Testing new feature"
```

### Runtime Version Policies

```json
// Use app version
"runtimeVersion": { "policy": "appVersion" }

// Use SDK version
"runtimeVersion": { "policy": "sdkVersion" }

// Use fingerprint (recommended for native changes)
"runtimeVersion": { "policy": "fingerprint" }

// Manual version
"runtimeVersion": "1.0.0"
```

## EAS Workflows (CI/CD)

### Basic Workflow

```yaml
# .eas/workflows/build-and-submit.yml
name: Build and Submit
on:
  push:
    branches: [main]

jobs:
  build:
    name: Build iOS
    type: build
    params:
      platform: ios
      profile: production

  submit:
    name: Submit to TestFlight
    type: submit
    needs: [build]
    params:
      platform: ios
      profile: production
```

### Development Build Workflow

```yaml
# .eas/workflows/development.yml
name: Development Build
on:
  push:
    branches: [develop]

jobs:
  build_ios:
    name: iOS Development
    type: build
    params:
      platform: ios
      profile: development

  build_android:
    name: Android Development
    type: build
    params:
      platform: android
      profile: development
```

### Preview Update Workflow

```yaml
# .eas/workflows/preview.yml
name: Preview Update
on:
  pull_request:
    branches: [main]

jobs:
  update:
    name: Publish Preview
    type: update
    params:
      branch: ${{ github.head_ref }}
      message: "PR #${{ github.event.pull_request.number }}"
```

### Complete CI/CD Pipeline

```yaml
# .eas/workflows/production.yml
name: Production Release
on:
  push:
    tags: ['v*']

jobs:
  test:
    name: Run Tests
    type: custom
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test

  build_ios:
    name: Build iOS
    type: build
    needs: [test]
    params:
      platform: ios
      profile: production

  build_android:
    name: Build Android
    type: build
    needs: [test]
    params:
      platform: android
      profile: production

  submit_ios:
    name: Submit iOS
    type: submit
    needs: [build_ios]
    params:
      platform: ios

  submit_android:
    name: Submit Android
    type: submit
    needs: [build_android]
    params:
      platform: android
```

## GitHub Actions Alternative

```yaml
# .github/workflows/eas-build.yml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build iOS
        run: eas build --platform ios --profile production --non-interactive
        
      - name: Build Android
        run: eas build --platform android --profile production --non-interactive
```

## Internal Distribution

### iOS Ad Hoc Distribution

```json
// eas.json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    }
  }
}
```

Register devices:
```bash
eas device:create
# Share URL with testers to register their devices
```

### Android APK Distribution

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Environment Variables

### In eas.json

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.production.com",
        "SENTRY_DSN": "@sentry-dsn"
      }
    }
  }
}
```

### EAS Secrets

```bash
# Create secret
eas secret:create --name SENTRY_DSN --value "your-dsn"

# List secrets
eas secret:list

# Reference in eas.json with @
"env": { "SENTRY_DSN": "@sentry-dsn" }
```

## Versioning

### Automatic Increment

```json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Manual Sync

```bash
# Sync version from stores
eas build:version:set --platform ios
eas build:version:set --platform android
```
