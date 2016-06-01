# ecs-task-cleaner

Cleans up stale task definitions from ECS.

Where "stale" means:
  * Not used by a service definition, nor an in-progress deployment
  * Not in the most recent five task definitions either

## Installing

```sh
npm install -g git+ssh://git@github.com/vend/ecs-task-cleaner.git#release
```

## Usage

```sh
$ ecs-task-cleaner -r us-west-2                  # dry-run
$ ecs-task-cleaner -r us-west-2 -v               # list out every task considered stale (still dry-run)
$ ecs-task-cleaner -r us-west-2 --mark-inactive  # actually mark stale tasks as inactive
$ DEBUG=* ecs-task-cleaner -r us-west-2          # with debug output
```
