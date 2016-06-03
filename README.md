# ecs-cleaner

Cleans up stale task definitions from ECS.

Where "stale" means:
  * Not used by a service definition, nor an in-progress deployment
  * Not in the most recent five task definitions either

## Installing

```sh
npm install -g git+ssh://git@github.com/vend/ecs-cleaner.git#release
```

## Usage

```sh
$ ecs-cleaner -r us-west-2                  # dry-run
$ ecs-cleaner -r us-west-2 -v               # list out every task considered stale (still dry-run)
$ ecs-cleaner -r us-west-2 --mark-inactive  # actually mark stale tasks as inactive
$ DEBUG=* ecs-cleaner -r us-west-2          # with debug output
```

## Example Output

```
$ ecs-cleaner -r us-west-2

Considering 1662 task definitions for removal

The following task definitions will NOT be removed, because they are in use:
  arn:aws:ecs:us-west-2:123456789:task-definition/abacus:163
  arn:aws:ecs:us-west-2:123456789:task-definition/banana:315
  arn:aws:ecs:us-west-2:123456789:task-definition/carrot:16
  arn:aws:ecs:us-west-2:123456789:task-definition/drink:26
  arn:aws:ecs:us-west-2:123456789:task-definition/events:30
  arn:aws:ecs:us-west-2:123456789:task-definition/flip:85
  arn:aws:ecs:us-west-2:123456789:task-definition/great:3
  arn:aws:ecs:us-west-2:123456789:task-definition/something:26
  arn:aws:ecs:us-west-2:123456789:task-definition/woop:54
Which means we are only considering 1639 task definitions

Furthermore, we don't remove task definitions among the newest 5 per family
Which means we are only considering 1525 task definitions

You didn't specify --mark-inactive, so we're stopping here. (Dry-run)
```
