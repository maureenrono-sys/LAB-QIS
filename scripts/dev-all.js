const { spawn } = require('child_process');

const children = [];

function run(name, command, args) {
    const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true
    });
    children.push(child);

    child.on('exit', (code) => {
        if (code !== 0) {
            process.stderr.write(`${name} exited with code ${code}\n`);
        }
    });
}

function shutdown() {
    for (const child of children) {
        if (!child.killed) {
            child.kill();
        }
    }
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.stdout.write('Starting backend + frontend static server...\n');
run('backend', 'npm', ['run', 'dev']);
run('frontend', 'npm', ['run', 'frontend:dev']);
