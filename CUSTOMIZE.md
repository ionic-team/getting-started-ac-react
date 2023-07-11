This app has been expanded beyond the "getting started" guide to make it easier to customize.

You can provide your own configuration via the `.env` file. However, there are a couple of code changes that may also need to be made.

## Basic Auth Connect Configuration

The application uses Auth0. To provide your own configuration:

- Update the values used in the `.env` file to match your own configuration.
- Do an `npm run build` to apply those changes.

If you are using Auth0 as well, that is very likely the only changes you should need to make.

## Other Providers

If you are using a provider other than Auth0, you will need to make a minor modification to the code. For most other providers, the only change is:

1. Open `src/providers/AuthProvider.tsx`.
1. Search for `Auth0Provider` (you should find two instances, both towards the top of the file).
1. Replace those two instances with a different provider. For example, if you are using AWS Cognito, change to the `CognitoProvider`.

If you are using provide we do not directly support, you may need to [create a custom provider](https://ionic.io/docs/auth-connect/custom-provider).

Happy Coding! 🤓
