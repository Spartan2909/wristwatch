const LOWER_BOUND = 470;
const PEAK_REGISTER_RATIO = 0.20;
const MOVEMENT_THRESHOLD = 70;
const AVERAGE_MULTIPLIER = 0.01;

radio.setGroup(0);

let time1 = 0;
let delta_t = 0;
let time2 = 0;
let pulse_data = 0;
let just_registered = false;
let average = 0;

basic.forever(() => {
    pulse_data = pins.analogReadPin(AnalogPin.P0);
    average = (pulse_data * AVERAGE_MULTIPLIER) + ((1 - AVERAGE_MULTIPLIER) * average);
});

/*
basic.forever(() => {
    serial.writeValue("Pulse Diagram", pulse_data);
    serial.writeValue("Moving Average", average);
});
*/

function motion_magnitude() {
    return Math.abs(Math.sqrt(
        input.acceleration(Dimension.X) ** 2 +
        input.acceleration(Dimension.Y) ** 2 +
        input.acceleration(Dimension.Z) ** 2
    ) - 1024);
}


basic.forever(() => {
    if (pulse_data > (average + (average * PEAK_REGISTER_RATIO)) && !just_registered) {
        time2 = input.runningTime();
        delta_t = time2 - time1;
        time1 = time2;
        let pulse_out = Math.floor(60000 / delta_t);
        //serial.writeValue("Current Pulse", pulse_out");
        
        // send data to remote
        let motion = motion_magnitude();

        radio.sendValue("pulse", pulse_out);
        //radio.sendValue("time", Math.floor(time1 / 60000));
        radio.sendValue("time", time1);
        radio.sendValue("movement", motion >= MOVEMENT_THRESHOLD ? 1 : 0);
        radio.sendValue("raw_mvmt", motion);

        just_registered = true;
    } else if (pulse_data <= LOWER_BOUND && just_registered) {
        just_registered = false;
    }
});
