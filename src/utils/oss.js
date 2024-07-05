import store from '@/store';
import OSS from 'ali-oss';
import $ from 'jquery';

class OSSClient {
    constructor() {
        this.tokenEndpoint = "http://localhost:3000/upload/token";
        this.region = "oss-cn-qingdao";
        this.bucket = "mim-media";
        this.expiration = null;
        this.client = null;
    }

    async getTemporaryToken() {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: this.tokenEndpoint,
                headers: {
                    Authorization: "Bearer " + store.state.user.token
                },
                method: 'GET',
                success: (resp) => {
                    const accessKeyId = resp.data.AccessKeyId;
                    const accessKeySecret = resp.data.AccessKeySecret;
                    const securityToken = resp.data.SecurityToken;
                    this.expiration = new Date(resp.data.Expiration);
                    this.client = new OSS({
                        region: this.region,
                        accessKeyId,
                        accessKeySecret,
                        stsToken: securityToken,
                        bucket: this.bucket,
                        secure: true
                    });
                    resolve();
                },
                error: (xhr, status, error) => {
                    reject(new Error('Failed to fetch temporary token: ' + error));
                }
            });
        });
    }

    async ensureClient() {
        if (!this.client || new Date() >= this.expiration) {
            await this.getTemporaryToken();
        }
    }

    async uploadFile(file, objectName, isPublic = false) {
        await this.ensureClient();

        try {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            const expirationDateString = expirationDate.toISOString();

            const options = {
                headers: {
                    'x-oss-meta-expiration-date': expirationDateString
                }
            };

            if (isPublic) {
                options.headers['x-oss-object-acl'] = 'public-read';
            }

            const result = await this.client.put(objectName, file, options);
            return result.url;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async getFileUrl(fileUrl) {
        await this.ensureClient();

        try {
            const url = new URL(fileUrl);
            const objectName = url.pathname.slice(1);
            const sinUrl = this.client.signatureUrl(objectName, { expires: 1 * 60 * 60 });
            return sinUrl;
        } catch (error) {
            console.error('Error getting file URL:', error);
            throw error;
        }
    }

    async downloadFile(objectName, downloadPath) {
        await this.ensureClient();

        try {
            const result = await this.client.get(objectName, downloadPath);
            return result;
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    }

    async deleteFile(objectName) {
        await this.ensureClient();

        try {
            const result = await this.client.delete(objectName);
            console.log(result);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }
}

export default OSSClient;
