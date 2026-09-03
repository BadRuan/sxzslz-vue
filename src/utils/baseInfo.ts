interface URL_Prefix {
    pic_prefix: string
    document_prefix: string
    api_prefix: string
}

const server1 = 'http://100.68.9.83:8088/'
const server2 = '/api/'

const dist_url_prefix = (url_server: string) => {
    return {
        pic_prefix: url_server + 'image/',
        document_prefix: url_server + 'document/',
        api_prefix: url_server
    }
}


const url_prefix: URL_Prefix = dist_url_prefix(server2)

export { url_prefix }