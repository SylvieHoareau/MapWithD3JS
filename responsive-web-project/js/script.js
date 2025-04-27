// filepath: /responsive-web-project/responsive-web-project/js/script.js
// Ce fichier contient le code JavaScript pour la logique de l'application.
// Il gère le redimensionnement de l'élément SVG de la carte et l'affichage des informations sur les communes.

const getContainerDimensions = () => {
    const containerWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const containerHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return { containerWidth, containerHeight };
}

const setDimensions = () => {
    const { containerWidth, containerHeight } = getContainerDimensions();
    const headerHeight = document.querySelector("header").offsetHeight;
    const footerHeight = document.querySelector("footer").offsetHeight;
    const height = containerHeight - headerHeight - footerHeight;
    return { width: containerWidth, height };
};

const resizeSVG = () => {
    const { width, height } = setDimensions();
    const svg = d3.select("#map").select("svg");
    if (svg.empty()) {
        const newSvg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        d3.select("#map")
            .style("width", width + "px")
            .style("height", height + "px");
    } else {
        svg
            .attr("width", width)
            .attr("height", height);

        d3.select("#map")
          .style("width", width + "px")
          .style("height", height + "px");

        const projection = d3.geoMercator()
            .center([55.5364, -21.1151])
            .scale(50000)
            .translate([width / 2, height / 2]);
        
        projection.fitSize([width, height], data);
        const path = d3.geoPath().projection(projection);

        const communes = svg.selectAll("path")
            .data(data.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => colorScale(d.properties.DENSITY))
            .attr("stroke", "#000")
            .attr("stroke-width", 0.5)
            .on("mouseover", (event, d) => {
                const population = d.properties.POPULATION;
                const surface = d.properties.AIRE;
                const communeName = d.properties.NOM;
                tooltip
                    .html(`<strong>${communeName}</strong><br>Population : ${population.toLocaleString()} habitants<br>Surface : ${surface.toLocaleString()} km²`)
                    .style("visibility", "visible")
                    .style("left", (event.pageX + 10)+"px")
                    .style("top", (event.pageY - 28)+"px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        const communeNames = svg.selectAll("text")
        .data(data.features)
        .join("text")
        .attr("class", "commune-name")
        .attr("x", d => path.centroid(d)[0])
        .attr("y", d => path.centroid(d)[1])
        .attr("font-size", `${(window.innerWidth / 100) *2}px`)
        .attr("fill", "#000")
        .text(d => d.properties.NOM);

        const legendWidth = 300;
        const legendHeight = 20;

        const legendGroup = svg.selectAll(".legend-group")
            .data([null])
            .join("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${20}, ${svgHeight -50})`);

        const gradient = legendGroup.selectAll("defs")
            .data([null])
            .join("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(0));

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(d3.max(data.features, d => d.properties.DENSITY)));

        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        const legendScale = d3.scaleLinear()
            .domain([0, d3.max(data.features, d => d.properties.DENSITY)])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale).ticks(5);

        legendGroup.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis);

        const scale = projection.scale();

        const scaleGroup = svg.selectAll(".scale-group")
            .data([null])
            .join("g")
            .attr("class", "scale-group")
            .attr("transform", `translate(${svgWidth - 120}, ${svgHeight - 30})`);

        scaleGroup.append("text")
            .data([null])
            .join("text")
            .attr("x", svgWidth - 100)
            .attr("y", svgHeight - 30)
            .attr("font-size", "12px")
            .attr("text-anchor", "end")
            .text(`Echelle: 1:${scale.toFixed(0)}`);

        const graticule = d3.geoGraticule();

        const graticuleGroup = svg.selectAll(".graticule-group")
            .data([null])
            .join("g")
            .attr("class", "graticule-group")
            .attr("transform", `translate(${svgWidth - 100}, ${svgHeight - 60})`);

        graticuleGroup.selectAll("path")
            .data([graticule()])
            .join("path")
            .attr("fill", "none")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 0.5)
            .attr("d", path);
        }
}

window.addEventListener('resize', resizeSVG);

resizeSVG(); 

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("pointer-events", "none");

const drawMap = (data) => {
    const { width: svgWidth, height: svgHeight } = setDimensions();

    const svg = d3.select('#map svg')
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const projection = d3.geoMercator()
        .center([55.5364, -21.1151])
        .scale(50000)
        .translate([svgWidth / 2, svgHeight / 2]);

    projection.fitSize([svgWidth, svgHeight], data);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, d3.max(data.features, d => d.properties.DENSITY)]);

    const communes = svg.selectAll("path")
        .data(data.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => colorScale(d.properties.DENSITY))
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        .on("mouseover", (event, d) => {
            const population = d.properties.POPULATION;
            const surface = d.properties.AIRE;
            const communeName = d.properties.NOM;
            tooltip
                .html(`<strong>${communeName}</strong><br>Population : ${population.toLocaleString()} habitants<br>Surface : ${surface.toLocaleString()} km²`)
                .style("visibility", "visible")
                .style("left", (event.pageX + 10)+"px")
                .style("top", (event.pageY - 28)+"px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    const communeNames = svg.selectAll("text")
        .data(data.features)
        .join("text")
        .attr("class", "commune-name")
        .attr("x", d => path.centroid(d)[0])
        .attr("y", d => path.centroid(d)[1])
        .attr("font-size", `${Math.max((window.innerWidth / 100) * 1.5, 12)}px`)
        .attr("fill", "#333")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text(d => d.properties.NOM);

    const legendWidth = 300;
    const legendHeight = 20;

    const legendGroup = svg.selectAll(".legend-group")
        .data([null])
        .join("g")
        .attr("class", "legend-group")
        .attr("transform", `translate(${20}, ${svgHeight -50})`);

    const gradient = legendGroup.selectAll("defs")
        .data([null])
        .join("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(0));
}

// Charger les données GeoJSON
d3.json("../assets/reunion.geojson").then(data => {
    drawMap(data); // Appeler la fonction pour dessiner la carte avec les données
    resizeSVG(); // Redimensionner le SVG après le chargement des données
}).catch(error => {
    console.error("Erreur lors du chargement du fichier GeoJSON :", error);
});