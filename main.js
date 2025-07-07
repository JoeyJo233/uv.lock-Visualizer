// Global variables
let allData = null;
let displayedData = { nodes: [], edges: [] };
let simulation = null;
let selectedIndex = -1;
let svg, container, link, node, labels;
let clickAction = 'expand';

function hideDropdown() {
    const dropdown = document.getElementById("autocompleteDropdown");
    dropdown.style.display = "none";
    selectedIndex = -1;
}

function showDropdown(matches, searchValue) {
    const dropdown = document.getElementById("autocompleteDropdown");
    dropdown.innerHTML = "";
    matches.forEach((node, index) => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.dataset.packageName = node.name;
        const nameHtml = highlightMatch(node.name, searchValue);
        item.innerHTML = `
            <div class="package-name">${nameHtml}</div>
            <div class="package-info">v${node.version} • ${node.source_type} • ${node.dependency_count} dependencies</div>
        `;
        item.addEventListener("click", function() {
            selectItem(node.name);
        });
        dropdown.appendChild(item);
    });
    dropdown.style.display = "block";
}

function updateSelection(items) {
    items.forEach((item, index) => {
        item.classList.toggle("highlighted", index === selectedIndex);
    });
}

function selectItem(packageName) {
    const input = document.getElementById("packageFilter");
    input.value = packageName;
    hideDropdown();
    filterDependencies();
}

function highlightMatch(text, searchValue) {
    if (!searchValue) return text;
    const regex = new RegExp(`(${escapeRegExp(searchValue)})`, "gi");
    return text.replace(regex, "<strong>$1</strong>");
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setupClickActionToggle() {
    const toggle = document.getElementById('clickActionToggle');
    const label = document.getElementById('clickActionLabel');
    toggle.addEventListener('change', function() {
        if (this.checked) {
            clickAction = 'hide';
            label.textContent = 'Click to hide node';
        } else {
            clickAction = 'expand';
            label.textContent = 'Click to expand neighbors';
        }
    });
}

function setupAutocomplete() {
    const input = document.getElementById("packageFilter");
    const dropdown = document.getElementById("autocompleteDropdown");
    input.addEventListener("input", function() {
        const value = this.value.toLowerCase().trim();
        selectedIndex = -1;
        if (value.length === 0) {
            hideDropdown();
            return;
        }
        const matches = allData.nodes.filter(node => 
            node.name.toLowerCase().includes(value)
        ).slice(0, 10);
        if (matches.length === 0) {
            hideDropdown();
            return;
        }
        showDropdown(matches, value);
    });
    input.addEventListener("keydown", function(event) {
        const items = dropdown.querySelectorAll(".autocomplete-item");
        if (event.key === "ArrowDown") {
            event.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelection(items);
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (selectedIndex >= 0 && items[selectedIndex]) {
                selectItem(items[selectedIndex].dataset.packageName);
            } else {
                filterDependencies();
            }
        } else if (event.key === "Escape") {
            hideDropdown();
        }
    });
    input.addEventListener("blur", function() {
        setTimeout(() => hideDropdown(), 150);
    });
    document.addEventListener("click", function(event) {
        if (!event.target.closest(".autocomplete-container")) {
            hideDropdown();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeVisualization();
    setupClickActionToggle();
    setupDragAndDrop();
    setupDownloadButton();
});

function setupDownloadButton() {
    const downloadBtn = document.getElementById('downloadPngBtn');
    downloadBtn.addEventListener('click', function() {
        if (!allData || displayedData.nodes.length === 0) {
            alert('No visualization to download. Please load a file first.');
            return;
        }
        downloadVisualizationAsPng();
    });
}

function downloadVisualizationAsPng() {
    try {
        const svgElement = document.getElementById('dependency-graph');
        const containerElement = document.getElementById('visualization-container');
        const width = containerElement.clientWidth;
        const height = 600;
        const svgClone = svgElement.cloneNode(true);
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        backgroundRect.setAttribute('fill', 'white');
        svgClone.insertBefore(backgroundRect, svgClone.firstChild);
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .node.source-type-git { fill: #ff7f0e; stroke: #333; stroke-width: 1.5px; }
            .node.source-type-registry { fill: #2ca02c; stroke: #333; stroke-width: 1.5px; }
            .node.source-type-unknown { fill: #d62728; stroke: #333; stroke-width: 1.5px; }
            .link { stroke: #999; stroke-opacity: 0.6; stroke-width: 1px; }
            .link.outgoing { stroke: #007bff; stroke-width: 2px; stroke-opacity: 1; }
            .link.incoming { stroke: #ff6b6b; stroke-width: 2px; stroke-opacity: 1; }
            .node-label { font-size: 12px; font-family: Arial, sans-serif; text-anchor: middle; fill: #333; }
            .arrowhead { fill: #999; }
            .arrowhead-outgoing { fill: #007bff; }
            .arrowhead-incoming { fill: #ff6b6b; }
        `;
        svgClone.insertBefore(styleElement, svgClone.firstChild);
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onerror = function(e) {
            console.error("Error loading image:", e);
            alert("Error creating PNG: Failed to load SVG image");
        };
        img.onload = function() {
            try {
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                const pngData = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                const filename = 'uv-lock-visualization-' + new Date().toISOString().slice(0, 10) + '.png';
                downloadLink.href = pngData;
                downloadLink.download = filename;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                setTimeout(() => {
                    document.body.removeChild(downloadLink);
                }, 100);
            } catch (err) {
                console.error("Error in image processing:", err);
                alert("Error creating PNG: " + err.message);
            }
        };
        img.src = url;
    } catch (err) {
        console.error("Error in download process:", err);
        alert("Error creating PNG: " + err.message);
    }
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const fileNameText = document.getElementById('file-name');
    dropZone.addEventListener('click', function(e) {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    function setDragOverState(isOver) {
        const dropZone = document.getElementById('drop-zone');
        dropZone.classList.toggle('drag-over', isOver);
    }
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault(); e.stopPropagation();
            setDragOverState(true);
        }, false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault(); e.stopPropagation();
            setDragOverState(false);
        }, false);
    });
    dropZone.addEventListener('drop', handleDrop, false);
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.lock')) {
                processFile(file);
            } else {
                alert('Please upload a .lock file.');
            }
        }
    }
}

function processFile(file) {
    if (!file) {
        resetVisualization();
        return;
    }
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    fileName.textContent = file.name;
    fileInfo.classList.add('active');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const result = parseUvLock(content);
            allData = result;
            const nodeById = new Map(allData.nodes.map(n => [n.id, n]));
            allData.edges.forEach(edge => {
                edge.source = nodeById.get(edge.source);
                edge.target = nodeById.get(edge.target);
            });
            document.getElementById('placeholder-message').style.display = 'none';
            resetFilter();
            setupAutocomplete();
        } catch (error) {
            console.error("Error processing file:", error);
            document.getElementById('stats').innerHTML = `<p>❌ Error processing file: ${error.message}</p>`;
            resetVisualization();
        }
    };
    reader.onerror = () => {
        document.getElementById('stats').innerHTML = `<p>❌ Error reading file.</p>`;
        resetVisualization();
    };
    reader.readAsText(file);
}

document.getElementById('file-input').addEventListener('change', (event) => {
    if (!event.target.files || event.target.files.length === 0) {
        return;
    }
    const file = event.target.files[0];
    processFile(file);
});

function parseUvLock(content) {
    const parts = content.split(/\n?\[\[package\]\]\n/);
    const package_blocks = parts.slice(1);
    const nodes = [];
    const edges = [];
    for (const block of package_blocks) {
        if (!block.trim()) continue;
        const nameMatch = block.match(/name = "([^"]+)"/);
        if (!nameMatch) continue;
        const packageName = nameMatch[1];
        const versionMatch = block.match(/version = "([^"]+)"/);
        const version = versionMatch ? versionMatch[1] : "unknown";
        let sourceType = "unknown";
        let sourceUrl = "";
        const sourceMatch = block.match(/source = \{([^}]+)\}/s);
        if (sourceMatch) {
            const sourceContent = sourceMatch[1];
            if (sourceContent.includes("registry")) {
                sourceType = "registry";
                const registryMatch = sourceContent.match(/registry = "([^"]+)"/);
                if (registryMatch) sourceUrl = registryMatch[1];
            } else if (sourceContent.includes("git")) {
                sourceType = "git";
                const gitMatch = sourceContent.match(/git = "([^"]+)"/);
                if (gitMatch) sourceUrl = gitMatch[1];
            }
        }
        const dependencies = [];
        const depsSection = block.match(/dependencies = \[(.*?)\]/s);
        if (depsSection) {
            const depsContent = depsSection[1];
            const depMatches = depsContent.matchAll(/\{ name = "([^"]+)"/g);
            for (const match of depMatches) {
                dependencies.push(match[1]);
            }
        }
        const node = {
            id: packageName,
            name: packageName,
            version: version,
            source_type: sourceType,
            source_url: sourceUrl,
            dependency_count: dependencies.length
        };
        nodes.push(node);
        for (const dep of dependencies) {
            const edge = {
                source: packageName,
                target: dep,
                relationship: 'depends_on'
            };
            edges.push(edge);
        }
    }
    return {
        nodes: nodes,
        edges: edges,
        metadata: {
            total_packages: nodes.length,
            total_dependencies: edges.length,
            description: 'Dependency graph from uv.lock file'
        }
    };
}

function resetVisualization() {
    document.getElementById('placeholder-message').style.display = 'block';
    const fileInfo = document.getElementById('file-info');
    fileInfo.classList.remove('active');
    if (simulation) {
        simulation.stop();
        updateVisualization({ nodes: [], edges: [] });
    }
}

function initializeVisualization() {
    const svgElement = document.getElementById('dependency-graph');
    const containerElement = document.getElementById('visualization-container');
    const width = containerElement.clientWidth;
    const height = 600;
    svg = d3.select("#dependency-graph")
        .attr("width", width)
        .attr("height", height);
    svg.selectAll("*").remove();
    const defs = svg.append("defs");
    defs.append("marker").attr("id", "arrowhead").attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrowhead");
    defs.append("marker").attr("id", "arrowhead-outgoing").attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrowhead-outgoing");
    defs.append("marker").attr("id", "arrowhead-incoming").attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrowhead-incoming");
    const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            container.attr("transform", event.transform);
        });
    svg.call(zoom);
    container = svg.append("g")
        .attr("transform", `translate(${width/2}, ${height/2})`);
    link = container.append("g").attr("class", "links").selectAll(".link");
    node = container.append("g").attr("class", "nodes").selectAll(".node");
    labels = container.append("g").attr("class", "labels").selectAll(".node-label");
    simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(0, 0))
        .force("collision", d3.forceCollide().radius(40))
        .on("tick", ticked);
    const initialTransform = d3.zoomIdentity.translate(width/2, height/2).scale(1);
    svg.call(zoom.transform, initialTransform);
    window.addEventListener('resize', function() {
        const newWidth = containerElement.clientWidth;
        svg.attr("width", newWidth);
        if (simulation) {
            simulation.alpha(0.1).restart();
            const newTransform = d3.zoomIdentity.translate(newWidth/2, height/2).scale(1);
            svg.call(zoom.transform, newTransform);
        }
    });
}

function updateVisualization(data) {
    const oldNodePositions = new Map(simulation.nodes().map(d => [d.id, { x: d.x, y: d.y, fx: d.fx, fy: d.fy }]));
    data.nodes.forEach(d => {
        if (oldNodePositions.has(d.id)) {
            Object.assign(d, oldNodePositions.get(d.id));
        }
    });
    node = node.data(data.nodes, d => d.id);
    node.exit().remove();
    node = node.enter().append("circle")
        .attr("class", d => `node source-type-${d.source_type}`)
        .attr("r", d => Math.max(5, Math.min(20, d.dependency_count * 2)))
        .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended))
        .on("click", handleNodeClick)
        .merge(node);
    link = link.data(data.edges, d => `${d.source.id}-${d.target.id}`);
    link.exit().remove();
    link = link.enter().append("line")
        .attr("class", "link")
        .attr("marker-end", "url(#arrowhead)")
        .merge(link);
    labels = labels.data(data.nodes, d => d.id);
    labels.exit().remove();
    labels = labels.enter().append("text")
        .attr("class", "node-label")
        .text(d => d.name)
        .attr("dy", ".35em")
        .merge(labels);
    const tooltip = d3.select("#tooltip");
    node.on("mouseover", function(event, d) {
        tooltip.style("opacity", 1).html(`<strong>${d.name}</strong><br/>version: ${d.version}<br/>type: ${d.source_type}<br/>dependencies: ${d.dependency_count}`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 10) + "px");
        link
            .classed("outgoing", l => l.source.id === d.id)
            .classed("incoming", l => l.target.id === d.id);
    }).on("mouseout", function() {
        tooltip.style("opacity", 0);
        link.classed("outgoing", false).classed("incoming", false);
    });
    simulation.nodes(data.nodes);
    simulation.force("link").links(data.edges);
    simulation.alpha(0.01).restart();
}

function ticked() {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => {
            const targetRadius = Math.max(5, Math.min(20, d.target.dependency_count * 2));
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            return d.target.x - (dx / distance) * (targetRadius + 8);
        })
        .attr("y2", d => {
            const targetRadius = Math.max(5, Math.min(20, d.target.dependency_count * 2));
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            return d.target.y - (dy / distance) * (targetRadius + 8);
        });
    node.attr("cx", d => d.x).attr("cy", d => d.y);
    labels.attr("x", d => d.x).attr("y", d => d.y + 25);
}

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.01).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

function handleNodeClick(event, d) {
    if (clickAction === 'expand') {
        expandNode(d);
    } else {
        hideNode(d);
    }
}

function expandNode(clickedNode) {
    const displayedNodeIds = new Set(displayedData.nodes.map(n => n.id));
    const nodesToAdd = [];
    allData.edges.forEach(edge => {
        if (edge.source.id === clickedNode.id && !displayedNodeIds.has(edge.target.id)) {
            if (!nodesToAdd.some(n => n.id === edge.target.id)) {
                nodesToAdd.push(edge.target);
            }
        } else if (edge.target.id === clickedNode.id && !displayedNodeIds.has(edge.source.id)) {
            if (!nodesToAdd.some(n => n.id === edge.source.id)) {
                nodesToAdd.push(edge.source);
            }
        }
    });
    if (nodesToAdd.length > 0) {
        nodesToAdd.forEach(n => {
            n.x = clickedNode.x + (Math.random() - 0.5) * 10;
            n.y = clickedNode.y + (Math.random() - 0.5) * 10;
        });
        nodesToAdd.forEach(n => displayedData.nodes.push(n));
        const allVisibleNodeIds = new Set(displayedData.nodes.map(n => n.id));
        const newEdges = allData.edges.filter(edge => 
            allVisibleNodeIds.has(edge.source.id) && allVisibleNodeIds.has(edge.target.id)
        );
        displayedData.edges = newEdges;
        updateVisualization(displayedData);
    }
}

function hideNode(clickedNode) {
    displayedData.nodes = displayedData.nodes.filter(n => n.id !== clickedNode.id);
    const clickedNodeId = clickedNode.id;
    displayedData.edges = displayedData.edges.filter(e => 
        e.source.id !== clickedNodeId && e.target.id !== clickedNodeId
    );
    updateVisualization(displayedData);
}

function filterDependencies() {
    const packageName = document.getElementById("packageFilter").value.trim().toLowerCase();
    if (!packageName || !allData) return;
    const targetNode = allData.nodes.find(n => n.name.toLowerCase().includes(packageName));
    if (!targetNode) {
        alert("未找到匹配的包名");
        return;
    }
    const connectedNodeIds = new Set([targetNode.id]);
    allData.edges.forEach(edge => {
        if (edge.source.id === targetNode.id) {
            connectedNodeIds.add(edge.target.id);
        }
        if (edge.target.id === targetNode.id) {
            connectedNodeIds.add(edge.source.id);
        }
    });
    const filteredNodes = allData.nodes.filter(node => connectedNodeIds.has(node.id));
    const relevantEdges = allData.edges.filter(edge => 
        connectedNodeIds.has(edge.source.id) && connectedNodeIds.has(edge.target.id)
    );
    displayedData = {
        nodes: filteredNodes,
        edges: relevantEdges
    };
    updateVisualization(displayedData);
    hideDropdown();
}

function resetFilter() {
    document.getElementById("packageFilter").value = "";
    hideDropdown();
    if (allData) {
        displayedData = {
            nodes: [...allData.nodes],
            edges: [...allData.edges]
        };
        updateVisualization(displayedData);
    }
}

document.getElementById("packageFilter").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        filterDependencies();
    }
});
