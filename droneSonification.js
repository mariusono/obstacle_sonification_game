class droneSonification {
    constructor(numOscillators, baseFreq, type, baseFreqFact) {
        this.numOscillators = numOscillators;
        this.baseFreq = baseFreq;
        this.type = type;

        this.playingFlag = false;
        this.distance = 1000; // some very large value to begin with.. 


        this.volumesArray = [...Array(this.numOscillators).keys()].map(i => 1 / (i + 1));
        this.volumesArray = this.volumesArray.map(n => mag2db(n)); // db values to mag

        this.baseFreqFact = baseFreqFact;

        this.oscillators = [];

        this.valHarmonicity = 1.0;
        this.valHarmonicityPrev = 1.0;

        // Create oscillators for Drone sounds - for Walls.. TO DO ! 
        for (let i = 0; i < this.numOscillators; i++) {
            this.oscillators.push(new Tone.Oscillator({
                frequency: this.baseFreq * this.baseFreqFact * i,
                type: this.type,
                // volume: this.initVolume,
                // volume: -60,
                volume: this.volumesArray[i],
                // detune: Math.random() * 30 - 15,
            }));
        }

        this.envelope = new Tone.AmplitudeEnvelope({
            attack: 0.05,
            decay: 0.05,
            sustain: 0.9,
            release: 0.05
        });

        // Create a panner
        this.panner = new Tone.Panner3D();
        this.panner.panningModel = 'HRTF';
        this.panner.setPosition(0, 0, 0);

        // Connect oscillators to envelope
        this.oscillators.forEach(o => {
            // o.connect(this.panner);
            o.connect(this.envelope);
            o.start(); // Start each oscillator ! 
        });

        // Connect envelope to panner
        this.envelope.connect(this.panner); 

        // create reverb node
        this.freeverb = new Tone.Freeverb(0.3,5000);
        this.panner.connect(this.freeverb);

        // this.freeverb = new Tone.Reverb(1.0);
        // this.panner.connect(this.freeverb);

    }

    setHarmonicity(v,mapInterval) {

        if (v < mapInterval[0]) v = mapInterval[0];
        if (v > mapInterval[1]) v = mapInterval[1];

        let rangeSize = mapInterval[1] - mapInterval[0];
        let perc_interval = 10; // only change the harmonicity in intervals of 10% of the input range. 

        v = Math.floor(v / (perc_interval * rangeSize / 100)) * (perc_interval * rangeSize / 100);
        if (v < mapInterval[0]) v = mapInterval[0];
        if (v > mapInterval[1]) v = mapInterval[1];

        // this.valHarmonicity = linearMapping(1.0, 2.0, mapInterval[1], mapInterval[0], v);
        
        this.valHarmonicity = exponentialMapping(1.0, 4.0, mapInterval[1], mapInterval[0], 8.0, v); // params : exponentialMapping(rangeOut_bottom, rangeOut_top, rangeIn_bottom, rangeIn_top, fac, val)
        // valPlayback = exponentialMapping(0.0, 4.0, 0, 1000, 3., v);

        if (this.valHarmonicity !== this.valHarmonicityPrev) {
            // Change base freqs of oscillators
            this.oscillators.forEach((osc, i) => {
                osc.frequency.rampTo(this.baseFreq * i * this.valHarmonicity, 0.2);
            });
        }

        this.valHarmonicityPrev = this.valHarmonicity;
    }

    setRoomSize(v, mapInterval) {
        if (v < mapInterval[0]) v = mapInterval[0];
        if (v > mapInterval[1]) v = mapInterval[1];

        let roomSize = exponentialMapping(0.05, 0.75, mapInterval[0], mapInterval[1], -1.5, v); // params : exponentialMapping(rangeOut_bottom, rangeOut_top, rangeIn_bottom, rangeIn_top, fac, val)
        
        console.log(roomSize);
        this.freeverb.roomSize.value = roomSize;
        // this.freeverb.roomSize.value = 0.7;
        this.freeverb.wet.value = 0.5;

        // let roomSize = exponentialMapping(0.5, 3.0, mapInterval[0], mapInterval[1], 2.0, v); // params : exponentialMapping(rangeOut_bottom, rangeOut_top, rangeIn_bottom, rangeIn_top, fac, val)
        // this.freeverb.decay = roomSize;
    }
}


