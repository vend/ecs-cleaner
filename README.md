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
$ ecs-cleaner ecs-task                              # Dry run
$ ecs-cleaner ecs-task -v                           # Dry run, plus list out every task considered stale
$ ecs-cleaner ecs-task --apply                      # Actually mark stale tasks as inactive
$ DEBUG='ecs-cleaner:*' ecs-cleaner ecs-task -vvv   # With extra-verbose debugging output
```

##### Example Output

```
$ ecs-cleaner ecs-task
[notice] Getting task definitions from AWS API
[notice] Considering 151 task definitions for removal
[info] The following task definitions will NOT be removed, because they are in use:
  arn:aws:ecs:us-west-2:123456789:task-definition/abacus:163
  arn:aws:ecs:us-west-2:123456789:task-definition/banana:315
  arn:aws:ecs:us-west-2:123456789:task-definition/carrot:16
  arn:aws:ecs:us-west-2:123456789:task-definition/drink:26
  arn:aws:ecs:us-west-2:123456789:task-definition/events:30
  arn:aws:ecs:us-west-2:123456789:task-definition/flip:85
  arn:aws:ecs:us-west-2:123456789:task-definition/great:3
  arn:aws:ecs:us-west-2:123456789:task-definition/something:26
  arn:aws:ecs:us-west-2:123456789:task-definition/woop:54
[notice] After active definition filtering, 127 remain
[info] Furthermore, we don't remove task definitions among the newest 5 per family
[notice] After family filtering, 12 remain
[info] The full list of definitions to remove is:
  arn:aws:ecs:us-west-2:123456789:task-definition/abacus:155
  arn:aws:ecs:us-west-2:123456789:task-definition/abacus:154
  arn:aws:ecs:us-west-2:123456789:task-definition/banana:305
  arn:aws:ecs:us-west-2:123456789:task-definition/carrot:9
  arn:aws:ecs:us-west-2:123456789:task-definition/carrot:10
  arn:aws:ecs:us-west-2:123456789:task-definition/drink:21
  arn:aws:ecs:us-west-2:123456789:task-definition/events:24
  arn:aws:ecs:us-west-2:123456789:task-definition/flip:81
  arn:aws:ecs:us-west-2:123456789:task-definition/something:20
  arn:aws:ecs:us-west-2:123456789:task-definition/something:21
  arn:aws:ecs:us-west-2:123456789:task-definition/woop:48
  arn:aws:ecs:us-west-2:123456789:task-definition/woop:49
[notice] You didn't specify --apply, so we're doing a dry run
[notice] All done!
```
