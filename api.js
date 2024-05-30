import axios from "axios";

export async function getRandomPerson() {
    try {
        const response = await axios.get('https://randomuser.me/api/', {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
        const value = response.data.results[0];
        return {
            first_name: value.name.first,
            last_name: value.name.last,
            picture: value.picture.medium,
            user_id: value.login.uuid
        };
    } catch (error) {
        console.log("Não consegui obter um utilizador aleatório!");
        console.error(error);
        throw error; // Rethrow the error to be handled by the caller
    }
}


export async function getQuote() {
    try {
        const response = await axios.get('https://api.quotable.io/random/');
        const data = response.data;
        return {
            content: data.content,
            author: data.author
        };
    } catch (error) {
        console.log("Não foi possível obter uma citação!");
        console.error(error);
        throw error; // Rethrow the error to be handled by the caller
    }
}


export function generateRandomValue() {
    return Math.floor(Math.random() * 50) + 1
}
