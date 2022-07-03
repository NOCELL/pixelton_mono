import React from 'react'
import css from './Toggle.module.scss'

const Toggle = ({value, onToggle}: {value: 0 | 1, onToggle: () => void}) => {

	return (
		<div
			className={css.Toggle + ' ' + css['Toggle_' + value]}
			onClick={onToggle}
		>
			<div className={css.TCircle} />
		</div>
	)

}

export default Toggle