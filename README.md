# Pulse Actions

This repository contains GitHub actions related to Pulse. The goal of the
current actions are to help manage the maintenance of the main Pulse
repositories.

## Usage

Each action in this repo can be used by referring to the foldername, for example:

```yaml
- name: yarn install
  uses: pulseflow/actions/yarn-install@v0.0.1
  with:
    cache-prefix: ${{ runner.os }}-v${{ matrix.node-version }}
```

## Releases

Releases are generated manually via [GitHub](https://github.com/pulseflow/actions/releases/new). Create the version tag for the next release, click "Generate release notes", and then publish the release.

## Docs

- [Creating a JavaScript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [actions/github-script](https://github.com/actions/github-script)
