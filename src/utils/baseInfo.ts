interface URL_Prefix {
    pic_prefix: string
    document_prefix: string
    api_prefix: string
}

const dev_url_prefix: URL_Prefix = {
    pic_prefix: 'http://100.68.9.83:8666/' + 'image/',
    document_prefix: 'http://100.68.9.83:8666/' + 'document/',
    api_prefix: 'http://100.68.9.83:8088/'
}

const dist_url_prefix: URL_Prefix = {
    pic_prefix: '/resources/' + 'image/',
    document_prefix: '/resources/' + 'document/',
    api_prefix: '/api/'
}

const url_prefix = dist_url_prefix

export { url_prefix }