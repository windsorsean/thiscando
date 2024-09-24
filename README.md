# Thiscando

## ⚠️ IMPORTANT ⚠️
*This project is still in early development (pre-alpha) and as such there may be bugs, security flaws, bad coding, missing features, and missing documentation. It may be best to come back later when the project is at least in beta.*

## Description
Thiscando is a Google Cloud function platform for managing integrations. It provides a flexible solution for handling various incoming HTTP requests and routing them to appropriate handlers.

## Table of Contents
- [Thiscando](#thiscando)
  - [⚠️ IMPORTANT ⚠️](#️-important-️)
  - [Description](#description)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Configuration](#configuration)
  - [Handlers](#handlers)
  - [Deployment](#deployment)
  - [Documentation](#documentation)
  - [Contributing](#contributing)
  - [License](#license)
    - [Mozilla Public License 2.0 with No-Sell Clause](#mozilla-public-license-20-with-no-sell-clause)
      - [What this means:](#what-this-means)

## Installation
1. Clone the repository:
   ```
   git clone https://github.com/your-username/thiscando.git
   cd thiscando
   ```
2. Install dependencies:
   ```
   cd functions
   npm install
   ```

## Usage
To run the project locally:
```
npm run serve
```

This will start the Firebase emulators, allowing you to test your functions locally.

To run the emulators with database persistence:
```
npm run serve-db
```

## Configuration
The project uses a `config.json` file or Firestore to define routes and their corresponding handlers. Each route configuration includes:
- `name`: A descriptive name for the route
- `match`: Criteria for matching incoming requests (path, body, params)
- `function`: The name of the handler function to be called

Example configuration:
```json
{
    "debug": true,
    "source": "firestore",
    "handlers": [
        {
            "name": "Add Config",
            "match": {
                "path": "/addconfig",
                "body": {
                    "name": "*",
                    "match": "*",
                    "function": "*"
                }
            },
            "function": "addConfig"
        },
        {
            "name": "Add Handler",
            "match": {
                "path": "/addhandler",
                "body": {
                    "code": "*",
                    "name": "*"
                }
            },
            "function": "addHandler"
        }
    ]
}
```

## Handlers
Handlers are implemented in separate files within the `handlers` directory. Current handlers include:
- `addConfig.js`: Handles adding new configurations
- `addHandler.js`: Handles adding new handler functions

To add a new handler:
1. Create a new file in the `handlers` directory
2. Implement the handler function
3. Add a corresponding entry in the configuration (either in `config.json` or Firestore)

## Deployment
To deploy only the functions to Firebase:
```
npm run deploy
```

To deploy both hosting and functions:
```
npm run deploy_all
```

These commands will deploy your functions to the Firebase project specified in your Firebase configuration.

## Documentation
To generate documentation:
```
npm run docs
```

This will create documentation using JSDoc in the `docs` directory.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
Thiscando is licensed under the Mozilla Public License 2.0 (MPL-2.0) with an additional clause:

### Mozilla Public License 2.0 with No-Sell Clause

This project is licensed under the [Mozilla Public License 2.0 (MPL-2.0)](https://www.mozilla.org/en-US/MPL/2.0/) with the following additional clause:

**No-Sell Clause**: You may not sell, lease, rent, or otherwise commercialize this software as a standalone product or as part of a larger product without explicit written permission from the original author(s).

#### What this means:

1. **Use and Modification**: You are free to use, modify, and distribute this software for both personal and commercial purposes.

2. **Attribution**: You must provide appropriate credit to the original project and indicate any changes made.

3. **Open Source**: If you distribute this software, you must make the source code for any of your modifications to the MPL-2.0 covered code available under the MPL-2.0 as well.

4. **Commercial Use**: You can use this software as part of your commercial projects or services, but you cannot sell the software itself or a product that is substantially based on this software without permission.

5. **Sublicensing**: You may not grant any rights to the software beyond those contained in this license without explicit permission from the original author(s).

6. **No Warranty**: This software is provided "as is", without warranty of any kind.

By using, modifying, or distributing Thiscando, you agree to abide by the terms of the Mozilla Public License 2.0 and the additional No-Sell Clause.

For any questions regarding the license or to obtain permission for use cases not covered by this license, please contact the original author(s).