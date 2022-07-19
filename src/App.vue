<template>
    <div id="app">
        <div class="app-inner">
            <h1>{{ msg }}</h1>
            <div class="loader" v-if="!init">
                <img src="/src/assets/images/bitcoin.svg" alt="bitcoin">
            </div>

            <transition name="fade">
                <div class="data" v-if="init">
                    <div class="range-container" v-if="!errored">
                        <div>
                            <span>Start Date:</span>
                            <datepicker v-model="from" :disabled-dates="disabledDatesFrom" @change="updateChart"
                                @input="updateDDT(from)">
                            </datepicker>
                        </div>
                        <div>
                            <span>End Date:</span>
                            <datepicker v-model="to" :disabled-dates="disabledDatesTo" @change="updateChart">
                            </datepicker>
                        </div>
                    </div>

                    <span class="max-range" v-if="!errored">(Max Date Range: 200 Days)</span>

                    <div style="position: absolute;" class="loader loader-chart" v-if="chartLoad">
                        <img src="/src/assets/images/bitcoin.svg" alt="bitcoin">
                    </div>
                    <div class="chart-wrapper" v-if="!errored">
                        <!-- CHART -->
                        <GChart type="LineChart" :data="chartData" :options="chartOptions" :resizeDebounce="500" />
                    </div>
                </div>
            </transition>
            <transition name="fade">
                <div v-if="errored">
                    <p class="error-message"><strong>Error:</strong> Sorry, there was a problem retrieving this information, please contatct an administrator.</p>
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
import moment from 'moment'
import Datepicker from 'vuejs-datepicker'
import { GChart } from 'vue-google-charts/legacy'

const axios = require('axios').default;

export default {
    name: 'app',
    components: {
        GChart,
        Datepicker
    },
    data() {
        return {
            msg: 'bitcoin Analyzer',
            init: null,
            chartLoad: false,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
            from: moment().subtract(1, 'days').toDate(),
            to: new Date(),
            disabledDatesFrom: {
                from: moment().subtract(1, 'days').toDate(),
                to: new Date('January 3, 2009'),                
            },
            disabledDatesTo: {
                from: new Date(),
                to: new Date(),
            },
            chartData: [['Year', 'Price']],
            chartOptions: {
                title: 'Bitcoin Value Over Time',
                curveType: 'function',
                legend: { position: 'bottom' },
                width: 1200,
                height: 600,
                vAxis: { 
                    title: 'Bitcoin Value',
                    format: 'currency',
                },
                hAxis: {
                    title: 'Date',
                    slantedText: true,
                    slantedTextAngle: 45,
                    format: 'M, d, ha',
                    textStyle: {
                        fontSize:10
                    }
                },
                lineWidth: 4,
                colors: ['#EB8C0E'],
            },
            errored: false
        }
    },
    
    mounted() {
        this.updateChart()
        window.addEventListener('resize', this.getDimensions)
    },
    watch: {
        from() {
            this.updateChart()
        },
        to() {
            this.updateChart()
        }
    },
    methods: {
        updateChart() {
            
            const twentyFourHours = 1000 * 60 * 60 * 24 + 2;
            const oneWeek = 1000 * 60 * 60 * 24 * 7;
            const oneMonth = oneWeek * 4;
            
            let periodNum = 1;
            let period = 'HRS';
            let span = (this.to - this.from);

            this.chartLoad = true;
            this.errored = false;
           
            
            if (span > twentyFourHours*2) {
                period = "DAY";
            }  
            if (span > oneWeek) {
                periodNum = 1;
                period = "DAY";
            }
            if (span > oneMonth) {
                periodNum = 10;   
                period = "DAY";             
            } 

            // this.init = true;
            //DD47492B-9C0A-4B8E-B13C-E832406CE5EF // <-- My Account
            // E3A68CAE-701C-4EC7-8660-E5F011403F1E //<--TEMP
            // 440EEB85-CD58-46FA-B1B3-37E7DA746015 <--TEMP2
            const headers = { 'X-CoinAPI-Key': '654E7564-BF70-4131-AD29-D254478D95A7' }; 

            let fromDate = moment(String(this.from)).format('YYYY-MM-DDThh:mm:ss');
            let toDate = moment(String(this.to)).format('YYYY-MM-DDThh:mm:ss');

            axios
                // EG988DSVV7PK3OIX
                .get('https://rest.coinapi.io/v1/exchangerate/BTC/USD/history?period_id='+periodNum+period+'&time_start=' + fromDate + '&time_end=' + toDate + '', { headers })

                .then(response => {
                    let data = response.data
                    this.chartData = [['Year', 'Price']];
                    if (data) {
                        for (let i = 0; i < data.length; i++) {

                            const time = new Date(data[i].time_close);
                            const rate = data[i].rate_close;

                            this.chartData.push([time.toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' }), rate])
                        }
                        this.init = true;
                        this.chartLoad = false;
                    }
                })
                .catch(error => {
                    console.log(error)
                    this.init = true;
                    this.chartLoad = false;
                    this.errored = true
                })
                .finally(() => {
                    window.dispatchEvent(new Event('resize'));
                })
        },
        updateDDT(selected) {
            var daysMax = this.addDays(selected, 200);
            var dateToday = new Date();

            this.disabledDatesTo.from = daysMax >= dateToday ? dateToday : daysMax;
            this.disabledDatesTo.to = selected;
            this.to = this.disabledDatesTo.from;
        },
        addDays(date, days) {
            var result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },
        getDimensions() {
            let currentWidth = document.documentElement.clientWidth;
            let currentHeight = document.documentElement.clientHeight;

            if (currentWidth < 1200) {
                this.chartOptions.width = currentWidth - 40;
            }
            if (currentWidth < 500 || currentHeight < 850) {
                this.chartOptions.height = 400;
            } else {
                this.chartOptions.height = 600;
            }                       
        }        
    }
}
</script>
