'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    #date = new Date();
    id = (Date.now() + "").slice(-10)

    constructor(distance, duration, coords) {
        this.distance = distance;
        this.duration = duration;
        this.coords = coords
    }

    _setDescription(type) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${type} on ${months[this.#date.getMonth()]} ${this.#date.getDate()}`
    }

}

class Running extends Workout {

    type = "running"

    constructor(distance, duration, coords, cadence) {
        super(distance, duration, coords)
        this.cadence = cadence;
        this.pace = this._pace()
        this._setDescription("Running")
    }

    _pace() {
        return this.duration / this.distance;
    }

}

class Cycling extends Workout {

    type = "cycling"

    constructor(distance, duration, coords, elevationGain) {
        super(distance, duration, coords)
        this.elevGain = elevationGain;
        this.speed = this._speed()
        this._setDescription("cycling")
    }

    _speed() {
        return this.distance / (this.duration / 60);
    }
}

const run1 = new Running(90, 120, [50, 50], 90)
const cyc1 = new Cycling(90, 120, [50, 50], 90)
console.log(run1, cyc1)

class App {

    #map;
    #mapE;
    #workout;
    #workouts = [];

    constructor() {
        this._getPosition()
        this._getLocalStorage()
        inputType.addEventListener("change", this._toggleElevationField)
        document.addEventListener("keydown", this._newWorkOut.bind(this))
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this))
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert("map dose'nt work without your location. ")
            })
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude]
        console.log(latitude, longitude)
        this.#map = L.map('map').setView(coords, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on("click", this._showForm.bind(this))
        if(!this.#workouts) return;
        this.#workouts.forEach(element => {
            this._setPopup(element)
        });
    }

    getWorkouts() {
        return this.#workouts
    }

    _showForm(mapEvent) {
        this.#mapE = mapEvent
        form.classList.remove("hidden")
        inputDistance.focus()
    }

    _hidingForm() {
        form.style.display = "none"
        form.classList.add("hidden")
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = ""
        setTimeout(() => (form.style.display = "grid"), 1000)
    }

    _toggleElevationField() {
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden")
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden")
    }

    _newWorkOut(event) {
        if (event.key == "Enter") {
            event.preventDefault()

            const finiteCheck = (...inputs) => inputs.every(element => Number.isFinite(element))
            const positiveCheck = (...inputs) => inputs.every(element => element > 0)
            const { lat, lng } = this.#mapE.latlng
            const coordsArr = [lat, lng]
            const type = inputType.value;
            const distance = +inputDistance.value;
            const duration = +inputDuration.value;

            if (type === "running") {
                const cadence = +inputCadence.value;
                if (finiteCheck(distance, duration, cadence) || positiveCheck(distance, duration, cadence)) {
                    this.#workout = new Running(distance, duration, coordsArr, cadence)
                }
            }

            if (type === "cycling") {
                const elevGain = +inputElevation.value;
                if (finiteCheck(distance, duration, elevGain) || positiveCheck(distance, duration, elevGain)) {
                    this.#workout = new Cycling(distance, duration, coordsArr, elevGain)
                }
            }

            this.#workouts.push(this.#workout);

            this._newWorkout(this.#workout)
            const tempWorkout = this.#workout
            this._setPopup(tempWorkout)
            this._hidingForm()
            this._setLocalStorage()


        }
    }

    _setPopup(workout) {
        L.marker(workout.coords, 15).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            })).setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`)
            .openPopup();
    }

    _newWorkout(workout) {
        console.log(workout)
        let html = `
        <li class="workout workout--${workout.type}" data-id=${workout.id}>
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
            `

        if (workout.type === "running") {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
            `
        }

        if (workout.type === "cycling") {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li
            `
        }
        form.insertAdjacentHTML("afterend", html)
    }

    _moveToPopup(event) {

        const workoutElement = event.target.closest(".workout")
        if (!workoutElement) return;
        const workout = this.#workouts.find(work => work.id === workoutElement.dataset.id)
        this.#map.setView(workout.coords, 15, {
            animate: true,
            pan: {
                duration: 1,
            }
        })
    }

    _setLocalStorage(){
        localStorage.setItem("workouts", JSON.stringify(this.#workouts))
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem("workouts"))
        if(!data) return;
        this.#workouts = data
        data.forEach(element => {
            this._newWorkout(element)
        });
    }

    reset(){
        localStorage.removeItem("workouts")
        location.reload()
    }
    
}

const app = new App()