const b_width = 1000;
const d_width = 500;
const b_height = 1000;
const d_height = 1000;
const colors = [
    '#DB202C', '#a6cee3', '#1f78b4',
    '#33a02c', '#fb9a99', '#b2df8a',
    '#fdbf6f', '#ff7f00', '#cab2d6',
    '#6a3d9a', '#ffff99', '#b15928']

const radius = d3.scaleLinear().range([.5, 20]);
const color = d3.scaleOrdinal().range(colors);
const x = d3.scaleLinear().range([0, b_width]);

const bubble = d3.select('.bubble-chart')
    .attr('width', b_width).attr('height', b_height);
const donut = d3.select('.donut-chart')
    .attr('width', d_width).attr('height', d_height)
    .append("g")
    .attr("transform", "translate(" + d_width / 2 + "," + d_height / 2 + ")");

const donut_lable = d3.select('.donut-chart').append('text')
    .attr('class', 'donut-lable')
    .attr("text-anchor", "middle")
    .attr('transform', `translate(${(d_width / 2)} ${d_height / 2})`);
const tooltip = d3.select('.tooltip');

const rParam = 'user rating score';
const xParam = 'release year';

const updateR = function (d) {
    let value = d[rParam] ? d[rParam] : 0;
    return Math.max(radius(value), 3);
};

const updateCx = function (d) {
    let value = d[xParam] ? d[xParam] : 0;
    return x(value);
};

const updateCy = function (d) {
    return 0;
};

//  Part 1 - Create simulation with forceCenter(), forceX() and forceCollide()
const simulation = d3.forceSimulation()
    .force('x', d3.forceX().x(updateCx))
    .force('collision', d3.forceCollide().radius(updateR))
    .force("center", d3.forceCenter(b_width / 2, b_height / 2));

d3.csv('data/netflix.csv').then(data => {
    data = d3.nest().key(d => d.title).rollup(d => d[0]).entries(data).map(d => d.value).filter(d => d['user rating score'] !== 'NA');
    console.log(data);

    const rating = data.map(d => +d['user rating score']);
    const years = data.map(d => +d['release year']);
    let ratings = d3.nest().key(d => d.rating).rollup(d => d.length).entries(data);

    // Part 1 - add domain to color, radius and x scales 

    color.domain(ratings.map(d => d.key));
    radius.domain([d3.min(rating), d3.max(rating)]);
    x.domain([d3.min(years), d3.max(years)]);
    
    // Part 1 - create circles

    let nodes = bubble
        .selectAll('circle').data(data);

    nodes.attr('r', updateR);
    nodes.attr('cx', updateCx);
    nodes.attr('cy', updateCy);
    nodes.style('fill', function (d) {
        return color(d.rating)
    });

    let nodesEnter = nodes.enter().append("circle");

    nodesEnter.attr('r', updateR);
    nodesEnter.attr('cx', updateCx);
    nodesEnter.attr('cy', updateCy);
    nodesEnter.style('fill', function (d) {
        return color(d.rating);
    });

    nodes.exit().remove();

    // Part 1 - create layout with d3.pie() based on rating

    var pie = d3.pie()
        .value(function (d) {
            return d.count;
        });
    let pieData = {};
    data.forEach(d => {
        if (!pieData[d.rating]) {
            pieData[d.rating] = {name: d.rating, count: 1};
        } else {
            pieData[d.rating].count++;
        }
    })
    const dataReady = Object.values(pieData).sort((a, b) => a.count - b.count);

    // Part 1 - create an d3.arc() generator

    var arc = d3.arc()
        .innerRadius(100) 
        .outerRadius(160)
        .padAngle(0.02)
        .cornerRadius(7);

    // Part 1 - draw a donut chart inside donut

    let top = donut.selectAll('path')
        .data(pie(dataReady))
        .enter().append('path')
        .attr('d', arc) 
        .attr('fill', function(d){
            return color(d.data.name);
        });

    // mouseover and mouseout event listeners
        // .on('mouseover', overBubble)
        // .on('mouseout', outOfBubble);


    d3.select('svg').selectAll('circle').on('mouseover', overBubble);
    d3.select('svg').selectAll('circle').on('mouseout', outOfBubble);

    // mouseover and mouseout event listeners
        //.on('mouseover', overArc)
        //.on('mouseout', outOfArc);

    d3.selectAll('path').on('mouseover', overArc);
    d3.selectAll('path').on('mouseout', outOfArc);

    
    // Part 1 - add data to simulation and add tick event listener 

    simulation
        .nodes(data)
        .on("tick", ticked);

    function ticked() {
        var u = d3.select('svg')
            .selectAll('circle')
            .data(data);
        u.enter()
            .append('circle')
            .attr('r', updateR)
            .style('fill', function (d) {
                return d.color;
            })
            .merge(u)
            .attr('cx', function (d) {
                return d.x
            })
            .attr('cy', function (d) {
                return d.y
            });
        u.exit().remove();
    }

    tooltip
        .style("position", "absolute")
        .style("font", "25px sans-serif")
        .style("visibility", "hidden")
        .style("z-index", "10")
        .style("background", "white")
        .style("border", "3px")
        .style("border-radius", "20px")
        .style("border-style", "solid")
        .style("padding", "3px")
        

    function overBubble(d) {
        // Part 2 - add stroke and stroke-width   

        this.setAttribute("stroke", "black");
        this.setAttribute("stroke-width", "2");

        // Part 3 - updata tooltip content with title and year
        // Part 3 - change visibility and position of tooltip

        tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px")
            .text(d.title+' '+d['release year'])
            .style("visibility", "visible");
    }



    function outOfBubble() {

         // Part 2 - remove stroke and stroke-width

        this.removeAttribute("stroke");
        this.removeAttribute("stroke-width");

        // Part 3 - change visibility of tooltip

        tooltip.style("visibility", "hidden");
    }


    function overArc(d) {

        // Part 2 - change opacity of an arc

        this.setAttribute("opacity", "0.7");

        // Part 2 - change donut_lable content

        donut_lable.text(d.data.name);

        // Part 3 - change opacity, stroke и stroke-width of circles based on rating

        d3.select('svg').selectAll('circle').each(function(e){
            if(e.rating === d.data.name){
                this.setAttribute("stroke", "black");
                this.setAttribute("stroke-width", "2");
            } else{
                this.setAttribute("opacity", "0.7");
            }
        })
    }

    function outOfArc(d) {

        // Part 2 - change opacity of an arc

        this.removeAttribute("opacity");

        // Part 2 - change content of donut_lable

        donut_lable.text('')
        
        // Part 3 - revert opacity, stroke and stroke-width of circles

        d3.select('svg').selectAll('circle').each(function(e){
            this.removeAttribute("stroke");
            this.removeAttribute("stroke-width");
            this.removeAttribute("opacity");
        })
    }
});