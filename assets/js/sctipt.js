var API_KEY = 'f899bcf6-72fe-46d1-b7cd-40b4958a3869';
var API_URL = 'https://public.intelx.io/';

    apiGet = function apiGet(url, parameters, success, error) {
        $.ajax({
            type: 'GET',
            url: API_URL + url + "?k=" + API_KEY + parameters,
            success: success,
            error: error
        });
    }

    apiPost = function apiPost(url, data, success, error) {
        $.ajax({
            type: 'POST',
            url: API_URL + url + "?k=" + API_KEY,
            data: data,
            success: success,
            error: error
        });
    }

    var lastid;

    async function apiSearchResult(id) {
        await apiGet('intelligent/search/result', "&id=" + id + "&limit=20",
            function(data) {
                // parse the items in the array "records"
                if (!!data && data.records.length > 0) {
                    $.each(data.records, function(i, record) {
                        $.ajax({
                            url: API_URL + "file/view",
                            headers: {
                                'x-key': API_KEY
                            },
                            type: 'GET',
                            cache: true,
                            data: "storageid=" + record['storageid'] +
                                "&f=" + 12 +
                                "&b=" + record['bucket'] +
                                "&k=" + API_KEY,
                            success: function(preview, textStatus, xhr) {
                                if (record['name'] != '') {
                                    let hours = (Number(new Date(record['date']).getHours()) < 10 ? `0${new Date(record['date']).getHours()}` : new Date(record['date']).getHours());

                                    let minutes = (Number(new Date(record['date']).getMinutes()) < 10 ? `0${new Date(record['date']).getMinutes()}` : new Date(record['date']).getMinutes());

                                    let date = (Number(new Date(record['date']).getDate()) < 10 ? `0${new Date(record['date']).getDate()}` : new Date(record['date']).getDate());

                                    let month = (Number(new Date(record['date']).getMonth()) < 10 ? `0${new Date(record['date']).getMonth()}` : new Date(record['date']).getMonth());
                                    $('#result').append(`
                                        <div id="${record['systemid']}" class="result-item">
                                            <span class="result-item-date">${new Date(record['date']).getFullYear()}/${month}/${date}, ${hours}:${minutes}</span>
                                            <h3 class="result-item-name">${record['name']}</h3>
                                            <div data-toogle-id="${record['systemid']}" id="results-preview-box">${preview}</div>
                                            <a data-toogle-id="${record['systemid']}" class="result-item-link" id="show-data-button" target="_blank">Full Data</a>
                                    </div>`);
                                }
                                // $('#result').append(record['date'] + '<br><pre>' + preview + '</pre><br><a href="https://intelx.io/?did=' + record['systemid'] + '" target="_blank">Full Data</a><hr>	');
                                // console.log(apiGetMachine(record['name']));
                            }
                        });
                    });
                }
                if (data.status == 0 || data.status == 3) {
                    setTimeout(function() {
                        apiSearchResult(id)
                    }, 1000);
                }
            },
            function(error) {
                $('#result').append('Unknown error.');
            }
        );
    }

    $(document).on('click', '#show-data-button', (e) => {
        const allBoxes = document.querySelectorAll('#results-preview-box');
        allBoxes.forEach((item) => {
            console.log(item.getAttribute('data-toogle-id'));
            if(item.getAttribute('data-toogle-id') === e.target.getAttribute('data-toogle-id')) {
                item.classList.toggle('mod-show-preview');
            } else {
                item.classList.remove('mod-show-preview');
            }
        })
        
    })

    $(document).on('click', '#submit1', function(event) {
        event.preventDefault();

        if ($('#domain').val() == '') {
            return;
        }

        apiPost('intelligent/search',
            JSON.stringify({
                term: $('#domain').val(),
                maxresults: 1000,
                media: 30,
                terminate: [!!lastid ? lastid : null],
                timeout: 20,
            }),
            function(p) {
                if (p.status == 1) {
                    $('#result').html('Invalid search term.');
                    return
                } else if (p.status == 2) {
                    $('#result').html('Error: Max concurrent searches reached.');
                    return
                }
                lastid = p.id
                $('#result').html("");
                apiSearchResult(p.id)
            },
            function(error) {
                if (error.status == 402) {
                    $('#result').html('Daily limit reached. Please contact <a href="mailto:info@intelx.io?subject=Archive.si">info@intelx.io</a> for a license or visit <a href="https://intelx.io/product">https://intelx.io/product</a>.');
                } else if (error.status == 403) {
                    $('#result').html('Access denied. Your IP is blacklisted. If you are using Tor, <a href="https://blog.intelx.io/2020/07/05/why-we-are-going-to-block-tor-ips/">read this</a>.');
                } else {
                    $('#result').html('Unknown Error');
                }
            }
        );
    });

    $(document).on('click', 'a.link', function(event) {
        document.getElementById('domain').value = event.target.text;
        document.getElementById("submit1").click();
        return false;
    });

    function getUrlVars() {
        var vars = {};
        var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
            vars[key] = value;
        });
        return vars;
    }

    function getUrlParam(parameter, defaultvalue) {
        var urlparameter = getUrlVars()[parameter];
        if (urlparameter === undefined) {
            return defaultvalue
        }
        return urlparameter;
    }

    $(document).ready(function() {
        var s = getUrlParam('s', '');
        var t = getUrlParam('t', 2);
        if (s != '') {
            document.getElementById('domain').value = s;
            document.getElementById("submit1").click();
        }
    });
// console.log(apiGetMachine())