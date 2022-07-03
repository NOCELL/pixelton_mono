export const plural = (n: number, w: string) => {
    let w_arr = w.split('|');
    let f = [w_arr[0] + w_arr[1], w_arr[0] + w_arr[2], w_arr[0] + w_arr[3]];
    return (n % 10 === 1 && n % 100 !== 11)
        ? f[0]
        : ( n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
                ? f[1]
                : f[2]
        );
};

export const getRandomInt = (min: number, max: number) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

export const number_format = (number: number, decimals: number, dec_point: string, thousands_sep: string ) => {

    let i, j, kw, kd, km;

    // input sanitation & defaults
    if( isNaN(decimals = Math.abs(decimals)) ){
        decimals = 2;
    }
    if( dec_point === undefined ){
        dec_point = ",";
    }
    if( thousands_sep === undefined ){
        thousands_sep = ".";
    }

    i = number.toFixed(decimals);

    if( (j = i.length) > 3 ){
        j = j % 3;
    } else{
        j = 0;
    }

    km = (j ? i.substring(0, j) + thousands_sep : "");
    kw = i.substring(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_sep);
    kd = (decimals ? dec_point + Math.abs(number - parseFloat(i)).toFixed(decimals).replace(/-/, '0').slice(2) : "");

    return km + kw + kd;
};

export type CookieType = string | undefined;

export const getCookie = (name: string): CookieType => {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

export const setCookie = (name: string, value: string, options: any) => {

    if (options.expiresDate) {
        options.expires = options.expiresDate.toUTCString();
    }

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    Object.keys(options).forEach((optionKey: string) => {

        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }

    });

    console.log(updatedCookie);

    document.cookie = updatedCookie;
}