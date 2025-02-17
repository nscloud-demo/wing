import { Construct } from "constructs";
import { Function, FunctionProps } from "./function";
import { fqnForType } from "../constants";
import { App } from "../core";
import { Duration, IResource, Node, Resource } from "../std";

/**
 * Global identifier for `Schedule`.
 */
export const SCHEDULE_FQN = fqnForType("cloud.Schedule");

/**
 * Options for `Schedule`.
 */
export interface ScheduleProps {
  /**
   * Trigger events at a periodic rate.
   * @example 1m
   * @default undefined
   */
  readonly rate?: Duration;

  /**
   * Trigger events according to a cron schedule using the UNIX cron format. Timezone is UTC.
   * [minute] [hour] [day of month] [month] [day of week]
   * @example "0/1 * ? * *"
   * @default undefined
   */
  readonly cron?: string;
}

/**
 * A schedule.
 *
 * @inflight `@winglang/sdk.cloud.IScheduleClient`
 */
export abstract class Schedule extends Resource {
  /**
   * Create a new schedule.
   * @internal
   */
  public static _newSchedule(
    scope: Construct,
    id: string,
    props: ScheduleProps = {}
  ): Schedule {
    return App.of(scope).newAbstract(SCHEDULE_FQN, scope, id, props);
  }

  constructor(scope: Construct, id: string, props: ScheduleProps = {}) {
    super(scope, id);

    Node.of(this).title = "Schedule";
    Node.of(this).description =
      "A cloud schedule to trigger events at regular intervals";

    const { cron, rate } = props;

    if (rate && cron) {
      throw new Error("rate and cron cannot be configured simultaneously.");
    }
    if (!rate && !cron) {
      throw new Error("rate or cron need to be filled.");
    }
    if (rate && rate.seconds < 60) {
      throw new Error("rate can not be set to less than 1 minute.");
    }
    if (cron && cron.split(" ").length > 5) {
      throw new Error(
        "cron string must be UNIX cron format [minute] [hour] [day of month] [month] [day of week]"
      );
    }
    if (cron && cron.split(" ")[2] == "*" && cron.split(" ")[4] == "*") {
      throw new Error(
        "cannot use * in both the Day-of-month and Day-of-week fields. If you use it in one, you must use ? in the other"
      );
    }
  }

  /** @internal */
  public _supportedOps(): string[] {
    return [];
  }

  /**
   * Create a function that runs when receiving the scheduled event.
   */
  public abstract onTick(
    inflight: IScheduleOnTickHandler,
    props?: ScheduleOnTickOptions
  ): Function;
}

/**
 * Options for Schedule.onTick.
 */
export interface ScheduleOnTickOptions extends FunctionProps {}

/**
 * A resource with an inflight "handle" method that can be passed to
 * `Schedule.on_tick`.
 *
 * @inflight `@winglang/sdk.cloud.IScheduleOnTickHandlerClient`
 */
export interface IScheduleOnTickHandler extends IResource {}

/**
 * Inflight interface for `Schedule`.
 */
export interface IScheduleClient {}

/**
 * Inflight client for `IScheduleOnTickHandler`.
 */
export interface IScheduleOnTickHandlerClient {
  /**
   * Function that will be called when a message is received from the schedule.
   * @inflight
   */
  handle(): Promise<void>;
}
