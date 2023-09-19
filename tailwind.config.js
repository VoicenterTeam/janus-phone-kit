const tailwindScheme = require('@voicenter-team/voicenter-ui-plus/src/theme/tailwindScheme')

const schemeColors = {
    ...tailwindScheme
}
// eslint-disable-next-line no-undef
module.exports = {
    content: [
        './src/**/*.{vue,scss}',
    ],
    theme: {
        colors: {
            ...schemeColors
        },
        borderColor: {
            ...schemeColors,
        },
        fill: schemeColors,
        fontFamily: {
            DEFAULT: [ 'Montserrat', 'sans-serif' ],
            sans: [ 'Montserrat', 'system-ui', 'sans-serif' ],
            body: [ 'Montserrat', 'system-ui', 'sans-serif' ]
        },
        screens: {
            sm: '680px',
            md: '960px',
            lg: '1264px',
            xlg: '1400px',
            xl: '1680px',
            '2xl': '1900px',
            '3xl': '2100px',
        },
        borderRadius: {
            none: '0',
            0.2: '0.2rem',
            xs: '0.125rem',
            sm: '0.25rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
            full: '9999px',
            tag: '2rem',
            DEFAULT: '0.25rem',
            0.875: '0.875rem'
        },
        extend: {
            zIndex: {
                navbar: 'var(--navbar-index)',
                sidebar: 'var(--sidebar-index)',
                filter: 'var(--filter-index)'
            },
            width: {
                18: '4.5rem',
                112: '28rem'
            },
            height: {
                18: '4.5rem'
            },
            maxWidth: {
                3: '0.75rem'
            },
            fontSize: {
                '7xl': '3.75rem',
                '8xl': '4.5rem',
            },
            transitionDuration: {
                DEFAULT: '0.3s'
            },
            boxShadow: {
                card: '0px 0px 5px var(--card-shadow-color)',
                'card-hover': '0px 0px 5px var(--active-elements--focus)'
            },
            spacing: {
                22: '5.5rem'
            },
            flex: {
                full: '0 0 100%'
            }
        },
    },
    plugins: [],
    variants: {
        backgroundColor: [ 'responsive', 'hover', 'focus', 'active' ],
        textColor: [ 'hover', 'focus', 'active' ]
    }
}
