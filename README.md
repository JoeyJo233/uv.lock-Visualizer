# uv.lock Visualizer

A web-based tool to visualize Python dependency graphs from uv.lock files.

🔗 **Live Demo**: [https://joeyjo233.github.io/uv.lock-Visualizer/](https://joeyjo233.github.io/uv.lock-Visualizer/)

## Background

### What is uv.lock?

`uv.lock` is a lockfile format used by [uv](https://github.com/astral-sh/uv), a fast Python package manager and resolver. The lockfile contains precise information about all dependencies in your project, including:

- Exact versions of all packages
- Dependency relationships between packages
- Source information (PyPI, Git repositories, etc.)
- Checksums for security and reproducibility

### Why Visualize Dependencies?

Understanding your project's dependency graph is crucial for:

- **Security Auditing**: Quickly identify vulnerable packages and their impact scope
- **Vulnerability Management**: Trace which packages depend on vulnerable dependencies to assess upgrade paths
- **Dependency Management**: Understand complex dependency chains and potential conflicts
- **Project Maintenance**: Identify unused or redundant dependencies
- **Troubleshooting**: Debug dependency resolution issues and version conflicts
- **Impact Analysis**: Assess the ripple effects of updating or removing packages

By visualizing your `uv.lock` file, you can make informed decisions about package updates, security patches, and dependency management strategies.

## Getting Started

Upload a uv.lock file to visualize dependencies.

## How to Interact with the Graph

### Navigation
- **Zoom**: Use the mouse wheel (or 2 fingers slide with touchpad) to zoom in and out of the graph
- **Pan**: Click and drag anywhere on the graph to move the view

### Node Interaction
- **Node Click Behavior**: Use the toggle switch to change the click behavior:
    - **Expand Neighbors**: Clicking a node will reveal its connected nodes
    - **Hide Node**: Clicking a node will remove it from the graph

## Additional Features

- **Filter Dependencies**: Enter a package name in the filter box to highlight related nodes. Use the "Reset" button to clear the filter
- **Download Graph**: Click the "Save as PNG" button to export the current graph visualization as a PNG image

## Quick Start

Start by uploading a uv.lock file to explore your dependency graph!
