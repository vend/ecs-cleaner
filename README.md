# ecs-cleaner

Cleans up stale task definitions, images or instances from ECS, ECR and EC2.

## Installing

Pull the latest stable ecs-cleaner container via Docker:

```sh
ecr=542640492856.dkr.ecr.us-west-2.amazonaws.com
ecr-login
docker pull $ecr/ecs-cleaner:master
```

## Usage

### Configuration

ecs-cleaner uses the standard AWS SDK environment variables and configuration files.
Inside the container, ecs-cleaner runs as the root user. So, one option for passing
in configuration is using environment variables, and the `-e` flag to `docker run`, e.g.

```
sudo docker run -e AWS_REGION=us-west-2 -e AWS_ACCESS_KEY_ID=foo $ecr/ecs-cleaner:master <subcommand>
```

But this isn't recommended, because it can leak your credentials into `ps`, `docker inspect`,
and other places. A better way to do this is to use the `~/.aws/config.json` and `~/.aws/credentials.json`
configuration files.

The user is root inside the container, so mount your config files at `/root/.aws`.

```
sudo docker run -e AWS_REGION=us-west-2 -v ~/.aws:/root/.aws $ecr/ecs-cleaner:master <subcommand>
```

### CLI usage

```
Usage: ecs-cleaner <command> [options]

Commands:
  ecs-task         Marks stale and unused ECS tasks as inactive
  ecr              Removes stale and unused ECR images
  ec2-stale-agent  Removes stale EC2 build agents

Options:
  --verbose, -v  Output more information (provide multiple times for more noise)
                                                                         [count]
  --quiet, -q    Output less information (provide multiple times for less noise)
                                                                         [count]
  --apply, -a    Actually apply the operation (default is a dry run)
                                                      [boolean] [default: false]
  --help         Show help                                             [boolean]
```

## Sub-Commands

### ecs-task

Deactivates stale ECS tasks (marks them as inactive). Tasks are considered to be stale if:

 * They're not one of the most recent five builds per-family, and
 * They're not in use by a running service in ECS

#### Examples

```sh
$ ecs-cleaner ecs-task                              # Dry run
$ ecs-cleaner ecs-task -v                           # Dry run, plus list out every task considered stale
$ ecs-cleaner ecs-task --apply                      # Actually mark stale tasks as inactive
$ ecs-cleaner ecs-task --help                       # See usage information
$ DEBUG='ecs-cleaner:*' ecs-cleaner ecs-task -vvv   # With extra-verbose debugging output
```

#### Example Output

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

---

### ecr

Removes stale ECR images from a single repository, specified by name. Images are considered stale if:

  * They aren't in use by an active ECS task definition, and
  * They are older than the configurable number of days (default 7 days)

#### Examples

```sh
$ ecs-cleaner ecr repo_name                      # Dry run against repo_name in $AWS_DEFAULT_REGION
$ ecs-cleaner ecr repo_name --apply --cutoff=14  # Actually remove stale images older than 14 days
$ ecs-cleaner ecr --help                         # Get usage information
```

#### Example Output

```
[info] Skipping active images, in use by ECS:
  123456789.dkr.ecr.us-west-2.amazonaws.com/foo:deadbee
[notice] You specified --apply, so we're about to start actually deleting these images
[debug] Not deleting b06c983 because it was created 3 days ago
[debug] Not deleting 8b866c9 because it was created 4 days ago
[debug] Not deleting 8c8b345 because it was created 4 days agp
[debug] Not deleting 0cb0516 because it was created 5 days ago
[debug] Not deleting ea91cf7 because it was created 5 days ago
[debug] Not deleting d9d43f0 because it was created 5 days ago
[debug] Not deleting f051f46 because it was created 5 days ago
[debug] Not deleting 09c5997 because it was created 5 days ago
[debug] Not deleting dc071e2 because it was created 5 days ago
[debug] Not deleting c084284 because it was created 5 days ago
[debug] Not deleting 64f6f20 because it was created 5 days ago
[debug] Not deleting 1760073 because it was created 5 days ago
[debug] Not deleting 1ff99aa because it was created 5 days ago
[debug] Not deleting master because tag starts with master
[notice] All done!
```

---

### ec2-stale-agent

Terminates stale EC2 instances, specified by the keypair they were launched with. Instances are considered stale if:

  * They have been running for longer than a day

#### Examples

```sh
$ ecs-cleaner ec2-stale-agent key-deadbeef             # Dry run against key keypair-deadbeef in $AWS_DEFAULT_REGION
$ ecs-cleaner ec2-stale-agent keypair-deadbeef --apply # Actually terminate stale instances
$ ecs-cleaner ec2-stale-agent --help                   # Get usage information
```

#### Example Output

```
[notice] Cleaning out ec2 instances that were launched with key some-key-name
[notice] You specified --apply, so we're about to start actually terminating these instances
[debug] Deciding for i-a2874ee7: won't terminate because launched 2 hours ago
[debug] Deciding for i-ab7cb2ee: won't terminate because launched 2 hours ago
[debug] Deciding for i-b6844df3: will terminate because launched 3 days ago
[notice] About to terminate i-b6844df3
[notice] All done!
```
