'use strict';

/**
 * USING CHARTIST.JS LIBRARY http://gionkunz.github.io/chartist-js
 * These are settings and functions for animation.
 * Snitched from https://github.com/gionkunz/chartist-js/issues/688
 * Not much to see here.
 * 
 * **/
var CHART = function () {

    var options = {
        low: 0,
        axisY: {
            onlyInteger: true,
            seriesBarDistance: 12
        }

    };

    return {
        makePartyChart: function makePartyChart(data) {
            var pChart = new Chartist.Bar('#partyChart', data, options);

            pChart.on('draw', function (data) {
                if (data.type === 'bar') {
                    data.element.attr({
                        style: 'stroke-width: 0px'
                    });
                    var strokeWidth = 50;

                    for (var s = 0; s < data.series.length; ++s) {
                        if (data.seriesIndex === s) {
                            data.element.animate({
                                y2: {
                                    begin: s * 500,
                                    dur: 500,
                                    from: data.y1,
                                    to: data.y2,
                                    easing: Chartist.Svg.Easing.easeOutSine
                                },
                                'stroke-width': {
                                    begin: s * 500,
                                    dur: 1,
                                    from: 0,
                                    to: strokeWidth,
                                    fill: 'freeze'
                                }
                            }, false);
                        }
                    }
                }
            });
            //this was a handler I made myself since the className prop seems to be broken
            pChart.on('draw', function (data) {
                if (data.type === 'bar') {
                    data.element.attr({
                        class: data.series[data.index].className
                    });
                }
            });
        },

        makeGenderChart: function makeGenderChart(data) {
            var gChart = new Chartist.Bar('#genderChart', data, options);

            gChart.on('draw', function (data) {
                if (data.type === 'bar') {
                    data.element.attr({
                        style: 'stroke-width: 0px'
                    });
                    var strokeWidth = 100;

                    for (var s = 0; s < data.series.length; ++s) {
                        if (data.seriesIndex === s) {
                            data.element.animate({
                                y2: {
                                    begin: s * 500,
                                    dur: 500,
                                    from: data.y1,
                                    to: data.y2,
                                    easing: Chartist.Svg.Easing.easeOutSine
                                },
                                'stroke-width': {
                                    begin: s * 500,
                                    dur: 1,
                                    from: 0,
                                    to: strokeWidth,
                                    fill: 'freeze'
                                }
                            }, false);
                        }
                    }
                }
            });

            gChart.on('draw', function (data) {
                if (data.type === 'bar') {
                    data.element.attr({
                        class: data.series[data.index].className
                    });
                }
            });
        }
    };
}();