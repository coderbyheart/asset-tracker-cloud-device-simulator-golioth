export const defaultConfig = {
	act: false, // Whether to enable the active mode
	actwt: 60, //In active mode: wait this amount of seconds until sending the next update. The actual interval will be this time plus the time it takes to get a GPS fix.
	mvres: 300, // (movement resolution) In passive mode: Time in seconds to wait after detecting movement before sending the next update
	mvt: 3600, // (movement timeout) In passive mode: Send update at least this often (in seconds)
	gnsst: 60, // GNSS timeout (in seconds): timeout for GNSS fix
	acct: 0.1, // Accelerometer threshold: minimal absolute value for and accelerometer reading to be considered movement.
	/**
	 * List of modules which should be disabled when sampling data.
	 *
	 * Because Golioth LightDB does not support arrays, this is an object
	 */
	nod: {} as { gnss?: boolean; ncell?: boolean },
} as const
