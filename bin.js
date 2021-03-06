const program = require('commander');
const client = require('./client.js')
const flatten = require('flatten-array');
const stringify = require('csv-stringify');
const fs = require('fs');
const path = require('path')

let query = `created:2018-06-06..* language:javascript stars:>0`
let pathFile = 'users.csv'

program
    .version('0.1.0')
    .option('-t, --token [token]', 'Github token')
    .option('-l, --languages [languages]', 'List of languages')
    .option('-o, --output [path]', 'Output path for the CSV')
    .parse(process.argv);

if (program.token) {
    client.authenticate({
        type: 'token',
        token: program.token
    })
}

if (program.languages)
    query = `created:2018-06-06..* language:${program.languages} stars:>0`

if (program.output)
    pathFile = path.join(program.output, pathFile)

client.search
    .repos({
        q: query,
        sort: 'stars',
        order: 'asc'
    })
    .then((result) => {
        return Promise.all(result.data.items.map((item) => {
            return client.activity.getStargazersForRepo({
                owner: item.owner.login,
                repo: item.name
            })
        }))
    })
    .then((stargazers) => {
        return flatten(stargazers.map((starg) => {
            return starg.data;
        }))
    })
    .then((users) => {
        return users.map((user) => {
            return {
                name: user.user.login,
                git_url: user.user.html_url
            }
        })
    })
    .then((users) => {
        stringify(users, function(err, output) {
            if (err) throw err;

            fs.writeFile(pathFile, output, (err) => {
                if (err) throw err;
                console.log(`The file has been saved : users.csv`);
            });
        });
    })
    .catch((err) => {
        console.log(`ERROR :: ${err}`);
    })
