# ecs-cleaner

Cleans up stale task definitions and images from ECS and ECR.

## Installing

Installing ecs-cleaner from NPM is pretty easy:

```sh
npm install -g git+ssh://git@github.com/vend/ecs-cleaner.git#release
```

The only thing to note if you're trying something more adventurous is that you'll probably
 want a version of the code that has the 'dist' directory pre-built (so you can run on non-ES6 runtimes.)

## Usage

```
$ ecs-cleaner --help
Usage: ecs-cleaner <command> [options]

Commands:
  ecs-task  Marks stale and unused ECS tasks as inactive

Options:
  --verbose, -v  Output more information (provide multiple times for more noise)
                                                                         [count]
  --quiet, -q    Output less information (provide multiple times for less noise)
                                                                         [count]
  --help         Show help                                             [boolean]
```

### Subcommands

#### ecs-task

Cleans stale ECS tasks. Stale is considered to be:

 * Not one of the most recent five builds per-family
 * Not in use by a running service in ECS

##### Examples

```sh
$ ecs-cleaner ecs-task                  # Do a dry run against $AWS_DEFAULT_REGION
$ ecs-cleaner ecs-task -r us-west-2     # Override the region
$ ecs-cleaner ecs-task -v               # Dry run, plus list out every task considered stale
$ ecs-cleaner ecs-task --mark-inactive  # Actually mark stale tasks as inactive
$ DEBUG=* ecs-cleaner                   # With debug output
```

##### Example Output

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
