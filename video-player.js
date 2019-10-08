Vue.component('video-player', {
    template: '#video-player',
    props: {
        src: String,
        startTime: Number,
        endTime: Number,
        loop: Boolean
    },
    async mounted(){
        if(this.src && this.src.length){
            this._getVideoDuration(this.src, (duration) => {
                this.duration = duration;
                this.$emit('duration', duration);
                this.$refs.video.volume = 1;
            });
        }
    },
    data(){
        return {
            currentTime: 0,
            duration: 0
        }
    },
    watch: {
        startTime: function(newValue){
            const video = this.$refs.video;
            if(video.currentTime < newValue)
                video.currentTime = newValue;
        },
        endTime: function(newValue){
            const video = this.$refs.video;
            if(video.currentTime > newValue)
                video.currentTime = newValue;
        }
    },
    methods: {
        setCurrentTime(time, updateVideo){
            const video = this.$refs.video;
            time = parseInt(time);
            if(time > this.endTime && !this.loop){
                video.pause();
                return this.setCurrentTime(this.endTime, true);
            }
            else if(time < this.startTime)
                return this.setCurrentTime(this.startTime, true);

            this.currentTime = time;
            if(updateVideo){
                video.currentTime = time;
            }

            if(time >= this.endTime && this.loop)
                return this.setCurrentTime(this.startTime, true);
            else if(time === this.startTime && this.loop && video.paused)
                video.play();
        },
        togglePlay(){
            const video = this.$refs.video;
            if((video.paused && video.currentTime === this.endTime) || video.ended){
                video.currentTime = this.startTime;
                video.play();
            }
            else if(video.paused){
                video.play();
            }
            else
                video.pause();
        },
        formatTime(time = 0){
            const hr  = Math.floor((time/3600));
            const min = Math.floor(((time%3600)/60));
            const sec = Math.floor((time%60));

            return `${hr}:${min}:${sec}`.split(':')
                    .map(t => t.padStart(2, '0'))
                    .join(':');
        },
        _getVideoDuration(url, next) {
            var _player = new Audio(url);
            _player.addEventListener("durationchange", function (e) {
                if (this.duration!=Infinity) {
                   var duration = this.duration
                   _player.remove();
                   next(duration);
                };
            }, false);      
            _player.load();
            _player.currentTime = 24*60*60; //fake big time
            _player.volume = 0;
            _player.play();
        }
    }
});