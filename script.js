// Définir les dimensions de la carte
const width = 960;
const height = 600;

// Créer un élément SVG
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Définir une projection géographique
const projection = d3.geoMercator()
    .center([55.5364, -21.1151]) // Coordonnées approximatives du centre de La Réunion
    .scale(50000) // Ajuster l'échelle pour zoomer sur la carte
    .translate([width / 2, height / 2]);

// Définir un générateur de chemins pour proeter les données géographiques
const path = d3.geoPath().projection(projection);

// Sélection de l'élément tooltip
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

// Charger les données GeoJSON de La Réunion
d3.json("reunion.geojson").then(data => {
    // Définir une échelle de couleur pour la densité
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, d3.max(data.features, d => d.properties.DENSITY)]);

    // Chemins des communes avec des couleurs basées sur la densité
    const communes = svg.append("g")
        .selectAll("path")
        .data(data.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", d => colorScale(d.properties.DENSITY))
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5)
        // Evénements de survol pour afficher les info-bulles
        .on("mouseover", (event, d) => {
            const population = d.properties.POPULATION;
            const surface = d.properties.AIRE;
            const communeName = d.properties.NOM;
            // Info-bulle lors du clic
            tooltip
                .html(`<strong>${communeName}</strong><br>Population : ${population.toLocaleString()} habitants<br>Surface : ${surface.toLocaleString()} km²`)
                .style("visibility", "visible")
                .style("left", (event.pageX + 10)+"px")
                .style("top", (event.pageY - 28)+"px");
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });

    // Ajouter le texte représentant le nom des communes
    svg.append("g")
        .selectAll("text")
        .data(data.features)
        .enter().append("text")
        .attr("x", d => {
            const centroid = path.centroid(d);
            return centroid[0];
        })
        .attr("y", d => {
            const centroid = path.centroid(d);
            return centroid[1];
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#000")
        .text(d => d.properties.NOM);

    // Légende
    const legendWidth = 300;
    const legendHeight = 20;

    // Groupe SVG pour la légende
    const legendGroup = svg.append("g")
    .attr("transform", `translate(${20}, ${height -50})`);

    const legend = legendGroup.append("g")
        .attr("transform", `translate(${width - legendWidth - 20}, ${height - legendHeight - 20})`);

    const gradient = legendGroup.append("defs").append("linearGradient")
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
        .style("fill", "url(#legend-gradient");

    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(data.features, d => d.properties.DENSITY)])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5);

    legendGroup.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);

    // Calculer l'échelle actuelle de la projection
    const scale = projection.scale();

    // Groupe SVG pour l'échelle
    const scaleGroup = svg.append("g")
        .attr("transform", `translate(${width - 120}, ${height - 30})`);

    // Element de texte pour afficher l'échelle
    scaleGroup.append("text")
        .attr("x", width - 100)
        .attr("y", height - 30)
        .attr("font-size", "12px")
        .attr("text-anchor", "end")
        .text(`Echelle: 1:${scale.toFixed(0)}`);

    // Définir le générateur de graticule
    const graticule = d3.geoGraticule();

    // Groupe SVG pour l'orientation
    const graticuleGroup = svg.append("g")
        .attr("transform", `translate(${width - 100}, ${height - 60})`);

    // Ajouter un élément de chemin pour dessiner le graticule
    graticuleGroup.append("path")
        .datum(graticule)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5)
        .attr("d", path);

}).catch(error => {
    console.error("Erreur lors du chargement des données GeoJSON : ", error);
});